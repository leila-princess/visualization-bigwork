let w = 300;
let h = w;
let scale_padding = 20;
let base_padding = 10;
let padding = scale_padding + base_padding;
let label_padding = 7;

function create_svg(id, x_range, y_range, x_label, y_label){
	svg = d3.select(id)
					.append("svg")
						.attr("viewBox", "0 0 "+ w + " " + h)
						.attr("cursor", "crosshair")//设置鼠标为十字

  // scales
  let xScale = d3.scaleLinear()
                 .domain(x_range)
							   .range([padding, w - padding]);
  let yScale = d3.scaleLinear()
 	  						 .domain(y_range)
 		  					 .range([padding, h - padding]);

	// axes
	let xAxis = y_range[0] === 0 ? d3.axisTop(): d3.axisBottom()
	xAxis.scale(xScale)
	if (x_label === "Θ"){
		xAxis.tickValues(d3.range(0, x_range[1]+1, 60))
	}else{
		xAxis.ticks(5)
	}
  let yAxis = d3.axisLeft()
                .scale(yScale)
                .ticks(5);
	svg.append("g")
	   .attr("transform", "translate(0,"+yScale(0)+")")
		 .call(xAxis);
	svg.append("g")
	   .attr("transform", "translate("+xScale(0)+",0)")
		 .call(yAxis);

	// labels
	//
	// direction of the x/y axis
	let x_dir = x_range[1] > x_range[0] ? 1: -1
	let y_dir = y_range[1] > y_range[0] ? 2: -1
	let x_label_pos = Math.max(x_range[0], x_range[1])
	let y_label_pos = Math.max(y_range[0], y_range[1])
	svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", xScale(x_label_pos)-label_padding*x_dir)
      .attr("y", yScale(0)+label_padding*y_dir)
      .attr("font-size", "10pt")
      .text(x_label);
	svg.append("text")
	    .attr("text-anchor", "start")
	    .attr("x", xScale(0)+label_padding*x_dir)
	    .attr("y", yScale(y_label_pos)-label_padding*y_dir)
	    .attr("font-size", "10pt")
	    .text(y_label);

  return [svg, xScale, yScale];
}

// function performing the actual hough transform
function r(theta, x, y) {
	return x * Math.cos(theta*2*Math.PI/360) + y * Math.sin(theta*2*Math.PI/360);
}

function insert_hough_plots0(svg1_id, svg2_id){
	let x_range = [-10, 10]
	let x_range2 = [0, 360]
	let y_range = [10, -10]
	let [svg1, xScale1, yScale1] = create_svg("#"+svg1_id, x_range, y_range, "x", "y")
	let [svg2, xScale2, yScale2] = create_svg("#"+svg2_id, x_range2, y_range, "Θ", "ρ")

	let data = [[5, 5, "black"]];
	let next_idx = 0
	let last_touch_y_pos = 0
	let touch_initial_pos = [0, 0]
	let drag_by_touch = false;
	let hover_lines_visible = false;

	data.forEach(p => insert_point(xScale1(p[0]), yScale1(p[1])))

	// svg1.on("click", function(){
	// 	insert_point(d3.mouse(this)[0], d3.mouse(this)[1])
	// });

	function insert_point(x, y) {
		idx = next_idx++
		color = d3.schemeCategory10[idx%10]//10个分类元素的数组
		// point in svg1
		svg1.append("circle")
			.attr("id", svg1_id + "-" + idx)
			.attr("cx", x)
			.attr("cy", y)
			.attr("r", 10)
			.attr("cursor", "move")
			.attr("fill", color)
			// .on("click", delete_point)
			.call(d3.drag()
				.on("drag", dragged)
				.on("start", drag_start)
				.on("end", drag_end)
			)
		// line in svg2
		svg2.append("path")
			.attr("id", svg1_id + "-" + idx + "-line")
			.datum(d3.range(x_range2[0], x_range2[1], 1))
			.attr("fill", "none")
			.attr("stroke", color)
			.attr("stroke-width", 1.5)
			.attr("d", gen_hough_line(x, y))
	}

	function gen_hough_line(x, y){
		return d3.line()
			.x(theta => xScale2(theta))
			.y(theta => yScale2(
					r(theta, xScale1.invert(x), yScale1.invert(y))
				)
			);
	}

	function delete_point(){
		d3.event.stopPropagation();
		d3.select(this).remove();
		d3.select("#" + this.id + "-line").remove();
	}

	function dragged(d) {
		let x = Math.max(xScale1(-10), Math.min(xScale1(10), d3.event.x));
		let y = Math.max(yScale1(10), Math.min(yScale1(-10), d3.event.y));
		// update point
		d3.select(this).attr("cx", x).attr("cy", y);
		// update line
		d3.select("#" + this.id + "-line").attr("d", gen_hough_line(x, y))
	}

	function drag_start(){
		svg1HoverRemoveLines();
		drag_by_touch = d3.touches(this).length > 0;
	}

	function drag_end(){
		if (!drag_by_touch){
			svg1HoverInsertLines(
				xScale1.invert(d3.mouse(this)[0]),
				yScale1.invert(d3.mouse(this)[1]),
				false
			)
		}
	}


	svg1.on("mouseenter", svg1MouseEnter)
		.on("mousemove", svg1MouseMove)
		.on("mouseleave", svg1MouseLeave)
		.on("touchstart", svg1TouchStart)
		.on("touchmove", svg1TouchMove)
		.on("touchend", svg1TouchEnd)

	function svg1HoverInsertLines(x, y, show_point){
		if (hover_lines_visible){
			return;
		}
		svg1_point = svg1.append("circle")
			.attr("id", svg1_id + "-hover-point")
			.attr("display", show_point ? "initial": "none")
			.attr("r", 5)
			.attr("fill", "grey")
		svg2_line = svg2.append("path")
			.attr("id", svg1_id + "-hover-line")
			.datum(d3.range(x_range2[0], x_range2[1], 1))
			.attr("fill", "none")
			.attr("stroke", "grey")
			.style("stroke-dasharray", "3, 3")
			.attr("stroke-width", 1.5)
		_svg1HoverSetHoverLinePos(x, y, svg1_point, svg2_line)
		hover_lines_visible = true;
	}

	function _svg1HoverSetHoverLinePos(x, y,
									   svg1_point, svg2_line
	){
		svg1_point
			.attr("cx", xScale1(x))
			.attr("cy", yScale1(y))
		svg2_line
			.attr("d", d3.line()
				.x(theta => xScale2(theta))
				.y(theta => yScale2(
						r(theta, x, y)
					)
				)
			)
	}

	function svg1HoverSetHoverLinePos(x, y){
		_svg1HoverSetHoverLinePos(x, y,
			d3.select("#" +  svg1_id + "-hover-point"),
			d3.select("#" +  svg1_id + "-hover-line")
		)
	}

	function svg1HoverRemoveLines(){
		d3.select("#" +  svg1_id + "-hover-line").remove();
		d3.select("#" +  svg1_id + "-hover-point").remove();
		hover_lines_visible = false;
	}

	function svg1MouseEnter(){
		svg1HoverInsertLines(
			xScale1.invert(d3.mouse(this)[0]),
			yScale1.invert(d3.mouse(this)[1]),
			false
		)
	}

	function svg1MouseMove(){
		svg1HoverSetHoverLinePos(
			xScale1.invert(d3.mouse(this)[0]),
			yScale1.invert(d3.mouse(this)[1])
		)
	}

	function svg1MouseLeave(){
		svg1HoverRemoveLines();
	}

	function svg1TouchStart(){
		d3.event.preventDefault();
		d3.event.stopPropagation();
		if (d3.touches(this).length == 1){
			touch_initial_pos = [d3.touches(this)[0][0], d3.touches(this)[0][1]]
		}else {
			svg1HoverRemoveLines();
		}
		// two finger scrolling
		if (d3.touches(this).length == 2){
			let touches = d3.touches(document.documentElement)
			last_touch_y_pos = (touches[0][1] + touches[1][1]) / 2;
		}
	}

	function svg1TouchEnd(){
		d3.event.preventDefault();
		d3.event.stopPropagation();
		svg1HoverRemoveLines();

		if (d3.touches(this).length == 1){
			touch_initial_pos = [-1, -1]
		}

		if (touch_initial_pos[0] != -1 ||
			touch_initial_pos[1] != -1
		){
			insert_point(touch_initial_pos[0], touch_initial_pos[1])
		}
	}

	function svg1TouchMove(){
		d3.event.preventDefault();
		d3.event.stopPropagation();
		if (d3.touches(this).length == 1){
			if ((touch_initial_pos[0] != -1 ||
					touch_initial_pos[1] != -1
				) &&
				(Math.abs(d3.touches(this)[0][0] > 50) ||
					Math.abs(d3.touches(this)[0][1] > 50)
				)
			){
				svg1HoverInsertLines(
					xScale1.invert(d3.touches(this)[0][0]),
					yScale1.invert(d3.touches(this)[0][1]) + 4,
					true
				);
				touch_initial_pos = [-1, -1]
			}
			if (touch_initial_pos[0] === -1 &&
				touch_initial_pos[1] === -1
			){
				svg1HoverSetHoverLinePos(
					xScale1.invert(d3.touches(this)[0][0]),
					yScale1.invert(d3.touches(this)[0][1]) + 4
				);
			}
		}else if (d3.touches(this).length == 2){
			// two finger scrolling
			let touches = d3.touches(document.documentElement)
			let touch_y_pos = (touches[0][1] + touches[1][1]) / 2;
			let diff = touch_y_pos - last_touch_y_pos;
			document.documentElement.scrollTop -= diff;
		}
	}

	svg2.on("touchstart", svg2TouchStart)
		.on("touchmove", svg2TouchMove)
		.on("touchend", svg2TouchEnd)
		.on("mouseenter", svg2MouseEnter)
		.on("mousemove", svg2MouseMove)
		.on("mouseleave", svg2MouseLeave);



	function svg2HoverSetHoverLinePos(theta, d){
		_svg2HoverSetHoverLinePos(theta, d,
			d3.select("#" + svg1_id + "-hover-svg1-d"),
			d3.select("#" + svg1_id + "-hover-svg1-line"),
			d3.select("#" + svg1_id + "-hover-svg2-d"),
			d3.select("#" + svg1_id + "-hover-svg2-theta"),
			d3.select("#" + svg1_id + "-hover-svg1-theta"),
		)
	}

	function _svg2HoverSetHoverLinePos(theta, d,
									   svg1_d, svg1_line, svg2_d, svg2_theta, svg1_theta
	){
		var p2 = [Math.cos(theta*2*Math.PI/360)*d, Math.sin(theta*2*Math.PI/360)*d];
		var p3 = [p2[0] + Math.cos((theta-90)*2*Math.PI/360)*30,
			p2[1] + Math.sin((theta-90)*2*Math.PI/360)*30]
		var p4 = [p2[0] + Math.cos((theta+90)*2*Math.PI/360)*30,
			p2[1] + Math.sin((theta+90)*2*Math.PI/360)*30]
		svg1_d
			.attr("x1", xScale1(0))
			.attr("y1", yScale1(0))
			.attr("x2", xScale1(p2[0]))
			.attr("y2", yScale1(p2[1]));
		svg1_line
			.attr("x1", xScale1(p3[0]))
			.attr("y1", yScale1(p3[1]))
			.attr("x2", xScale1(p4[0]))
			.attr("y2", yScale1(p4[1]));
		svg2_d
			.attr("x1", xScale2(theta))
			.attr("y1", yScale2(0))
			.attr("x2", xScale2(theta))
			.attr("y2", yScale2(d));
		svg2_theta
			.attr("x1", xScale2(0))
			.attr("y1", yScale2(0))
			.attr("x2", xScale2(theta))
			.attr("y2", yScale2(0));
		let rad = xScale1(d)-xScale1(0);
		let offset = rad < 0 ? -90: 90;
		svg1_theta
			.attr("d", d3.arc()
				.innerRadius(Math.abs(rad))
				.outerRadius(Math.abs(rad))
				.startAngle(offset * (Math.PI/180))
				.endAngle((offset-theta) * (Math.PI/180))
			).attr("transform", "translate("+xScale1(0)+","+yScale1(0)+")")
	}

	function svg2HoverInsertLines(theta, d){
		svg1_d = svg1.append("line")
			.attr("id", svg1_id + "-hover-svg1-d")
			.attr("stroke", "red")
			.attr("stroke-width", 1.5)
		svg1_line = svg1.append("line")
			.attr("id", svg1_id + "-hover-svg1-line")
			.attr("stroke", "#444")
			.attr("stroke-width", 1.5)
		svg2_d = svg2.append("line")
			.attr("id", svg1_id + "-hover-svg2-d")
			.attr("stroke", "red")
			.attr("stroke-width", 1.5)
		svg2_theta = svg2.append("line")
			.attr("id", svg1_id + "-hover-svg2-theta")
			.attr("stroke", "green")
			.attr("stroke-width", 1.5)
		svg1_theta = svg1.append("path")
			.attr("id", svg1_id + "-hover-svg1-theta")
			.attr("fill", "none").attr("stroke-width", 1.5)
			.attr("stroke", "green")
		_svg2HoverSetHoverLinePos(theta, d,
			svg1_d, svg1_line, svg2_d, svg2_theta, svg1_theta
		)
	}

	function svg2HoverRemoveLines(){
		d3.select("#" + svg1_id + "-hover-svg1-d").remove()
		d3.select("#" + svg1_id + "-hover-svg1-line").remove()
		d3.select("#" + svg1_id + "-hover-svg2-d").remove()
		d3.select("#" + svg1_id + "-hover-svg2-theta").remove()
		d3.select("#" + svg1_id + "-hover-svg1-theta").remove()
	}

	// top-level event handlers

	function svg2MouseEnter(){
		svg2HoverInsertLines(
			xScale2.invert(d3.mouse(this)[0]),
			yScale2.invert(d3.mouse(this)[1])
		);
	}

	function svg2MouseMove(){
		svg2HoverSetHoverLinePos(
			xScale2.invert(d3.mouse(this)[0]),
			yScale2.invert(d3.mouse(this)[1])
		);
	}

	function svg2MouseLeave(){
		svg2HoverRemoveLines();
	}

	function svg2TouchStart(){
		d3.event.preventDefault();
		d3.event.stopPropagation();
		if (d3.touches(this).length == 1){
			svg2HoverInsertLines(
				xScale2.invert(d3.touches(this)[0][0]),
				yScale2.invert(d3.touches(this)[0][1]) + 4
			);
		}else {
			svg2HoverRemoveLines();
		}
		// two finger scrolling
		if (d3.touches(this).length == 2){
			let touches = d3.touches(document.documentElement)
			last_touch_y_pos = (touches[0][1] + touches[1][1]) / 2;
		}
	}

	function svg2TouchMove(){
		d3.event.preventDefault();
		d3.event.stopPropagation();
		if (d3.touches(this).length == 1){
			svg2HoverSetHoverLinePos(
				xScale2.invert(d3.touches(this)[0][0]),
				yScale2.invert(d3.touches(this)[0][1]) + 4
			);
		}else if (d3.touches(this).length == 2){
			// two finger scrolling
			let touches = d3.touches(document.documentElement)
			let touch_y_pos = (touches[0][1] + touches[1][1]) / 2;
			let diff = touch_y_pos - last_touch_y_pos;
			document.documentElement.scrollTop -= diff;
		}
	}

	function svg2TouchEnd(){
		d3.event.preventDefault();
		d3.event.stopPropagation();
		svg2HoverRemoveLines();
	}
}



function insert_hough_plots(svg1_id, svg2_id){
	let x_range = [-10, 10]
	let x_range2 = [0, 360]
	let y_range = [10, -10]
	let [svg1, xScale1, yScale1] = create_svg("#"+svg1_id, x_range, y_range, "x", "y")
	let [svg2, xScale2, yScale2] = create_svg("#"+svg2_id, x_range2, y_range, "Θ", "ρ")

	let data = [[5, 5, "black"]];
	let next_idx = 0
	let last_touch_y_pos = 0
	let touch_initial_pos = [0, 0]
	let drag_by_touch = false;
	let hover_lines_visible = false;

	data.forEach(p => insert_point(xScale1(p[0]), yScale1(p[1])))

	svg1.on("click", function(){
	  insert_point(d3.mouse(this)[0], d3.mouse(this)[1])
  });

	function insert_point(x, y) {
		idx = next_idx++
		color = d3.schemeCategory10[idx%10]//10个分类元素的数组
		// point in svg1
		svg1.append("circle")
		    .attr("id", svg1_id + "-" + idx)
				.attr("cx", x)
        .attr("cy", y)
        .attr("r", 10)
        .attr("cursor", "move")
        .attr("fill", color)
        .on("click", delete_point)
        .call(d3.drag()
                .on("drag", dragged)
								.on("start", drag_start)
								.on("end", drag_end)
							)
		// line in svg2
		svg2.append("path")
        .attr("id", svg1_id + "-" + idx + "-line")
        .datum(d3.range(x_range2[0], x_range2[1], 1))
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("d", gen_hough_line(x, y))
	}

	function gen_hough_line(x, y){
		return d3.line()
			.x(theta => xScale2(theta))
			.y(theta => yScale2(
					r(theta, xScale1.invert(x), yScale1.invert(y))
				)
			);
	}

	function delete_point(){
    d3.event.stopPropagation();
    d3.select(this).remove();
		d3.select("#" + this.id + "-line").remove();
  }

	function dragged(d) {
    let x = Math.max(xScale1(-10), Math.min(xScale1(10), d3.event.x));
    let y = Math.max(yScale1(10), Math.min(yScale1(-10), d3.event.y));
		// update point
		d3.select(this).attr("cx", x).attr("cy", y);
		// update line
		d3.select("#" + this.id + "-line").attr("d", gen_hough_line(x, y))
  }

	function drag_start(){
		svg1HoverRemoveLines();
		drag_by_touch = d3.touches(this).length > 0;
	}

	function drag_end(){
		if (!drag_by_touch){
			svg1HoverInsertLines(
				xScale1.invert(d3.mouse(this)[0]),
				yScale1.invert(d3.mouse(this)[1]),
				false
			)
		}
	}


  svg1.on("mouseenter", svg1MouseEnter)
	    .on("mousemove", svg1MouseMove)
			.on("mouseleave", svg1MouseLeave)
			.on("touchstart", svg1TouchStart)
			.on("touchmove", svg1TouchMove)
			.on("touchend", svg1TouchEnd)

	function svg1HoverInsertLines(x, y, show_point){
		if (hover_lines_visible){
			return;
		}
		svg1_point = svg1.append("circle")
				  .attr("id", svg1_id + "-hover-point")
					.attr("display", show_point ? "initial": "none")
					.attr("r", 5)
					.attr("fill", "grey")
		svg2_line = svg2.append("path")
          .attr("id", svg1_id + "-hover-line")
          .datum(d3.range(x_range2[0], x_range2[1], 1))
          .attr("fill", "none")
          .attr("stroke", "grey")
					.style("stroke-dasharray", "3, 3")
          .attr("stroke-width", 1.5)
		_svg1HoverSetHoverLinePos(x, y, svg1_point, svg2_line)
		hover_lines_visible = true;
	}

	function _svg1HoverSetHoverLinePos(x, y,
			svg1_point, svg2_line
	){
		svg1_point
			.attr("cx", xScale1(x))
			.attr("cy", yScale1(y))
		svg2_line
			.attr("d", d3.line()
				.x(theta => xScale2(theta))
				.y(theta => yScale2(
						r(theta, x, y)
					)
				)
			)
	}

	function svg1HoverSetHoverLinePos(x, y){
		_svg1HoverSetHoverLinePos(x, y,
			d3.select("#" +  svg1_id + "-hover-point"),
			d3.select("#" +  svg1_id + "-hover-line")
		)
	}

	function svg1HoverRemoveLines(){
		d3.select("#" +  svg1_id + "-hover-line").remove();
		d3.select("#" +  svg1_id + "-hover-point").remove();
		hover_lines_visible = false;
	}

	function svg1MouseEnter(){
    svg1HoverInsertLines(
			xScale1.invert(d3.mouse(this)[0]),
			yScale1.invert(d3.mouse(this)[1]),
			false
		)
  }

	function svg1MouseMove(){
		svg1HoverSetHoverLinePos(
			xScale1.invert(d3.mouse(this)[0]),
			yScale1.invert(d3.mouse(this)[1])
		)
	}

	function svg1MouseLeave(){
		svg1HoverRemoveLines();
	}

	function svg1TouchStart(){
		d3.event.preventDefault();
    d3.event.stopPropagation();
    if (d3.touches(this).length == 1){
			touch_initial_pos = [d3.touches(this)[0][0], d3.touches(this)[0][1]]
    }else {
      svg1HoverRemoveLines();
    }
		// two finger scrolling
		if (d3.touches(this).length == 2){
			let touches = d3.touches(document.documentElement)
			last_touch_y_pos = (touches[0][1] + touches[1][1]) / 2;
    }
	}

	function svg1TouchEnd(){
		d3.event.preventDefault();
    d3.event.stopPropagation();
    svg1HoverRemoveLines();

		if (d3.touches(this).length == 1){
			touch_initial_pos = [-1, -1]
		}

		if (touch_initial_pos[0] != -1 ||
				touch_initial_pos[1] != -1
		){
		  insert_point(touch_initial_pos[0], touch_initial_pos[1])
		}
	}

	function svg1TouchMove(){
		d3.event.preventDefault();
    d3.event.stopPropagation();
    if (d3.touches(this).length == 1){
			if ((touch_initial_pos[0] != -1 ||
				   touch_initial_pos[1] != -1
			    ) &&
				  (Math.abs(d3.touches(this)[0][0] > 50) ||
					 Math.abs(d3.touches(this)[0][1] > 50)
				  )
			){
				svg1HoverInsertLines(
					xScale1.invert(d3.touches(this)[0][0]),
					yScale1.invert(d3.touches(this)[0][1]) + 4,
					true
				);
				touch_initial_pos = [-1, -1]
			}
			if (touch_initial_pos[0] === -1 &&
				   touch_initial_pos[1] === -1
			){
				svg1HoverSetHoverLinePos(
					xScale1.invert(d3.touches(this)[0][0]),
					yScale1.invert(d3.touches(this)[0][1]) + 4
				);
			}
    }else if (d3.touches(this).length == 2){
			// two finger scrolling
			let touches = d3.touches(document.documentElement)
      let touch_y_pos = (touches[0][1] + touches[1][1]) / 2;
      let diff = touch_y_pos - last_touch_y_pos;
      document.documentElement.scrollTop -= diff;
    }
	}

	svg2.on("touchstart", svg2TouchStart)
      .on("touchmove", svg2TouchMove)
      .on("touchend", svg2TouchEnd)
      .on("mouseenter", svg2MouseEnter)
      .on("mousemove", svg2MouseMove)
      .on("mouseleave", svg2MouseLeave);



	function svg2HoverSetHoverLinePos(theta, d){
		_svg2HoverSetHoverLinePos(theta, d,
      d3.select("#" + svg1_id + "-hover-svg1-d"),
			d3.select("#" + svg1_id + "-hover-svg1-line"),
			d3.select("#" + svg1_id + "-hover-svg2-d"),
			d3.select("#" + svg1_id + "-hover-svg2-theta"),
			d3.select("#" + svg1_id + "-hover-svg1-theta"),
    )
	}

	function _svg2HoverSetHoverLinePos(theta, d,
			svg1_d, svg1_line, svg2_d, svg2_theta, svg1_theta
	){
		var p2 = [Math.cos(theta*2*Math.PI/360)*d, Math.sin(theta*2*Math.PI/360)*d];
    var p3 = [p2[0] + Math.cos((theta-90)*2*Math.PI/360)*30,
              p2[1] + Math.sin((theta-90)*2*Math.PI/360)*30]
    var p4 = [p2[0] + Math.cos((theta+90)*2*Math.PI/360)*30,
              p2[1] + Math.sin((theta+90)*2*Math.PI/360)*30]
    svg1_d
        .attr("x1", xScale1(0))
        .attr("y1", yScale1(0))
        .attr("x2", xScale1(p2[0]))
        .attr("y2", yScale1(p2[1]));
    svg1_line
        .attr("x1", xScale1(p3[0]))
        .attr("y1", yScale1(p3[1]))
        .attr("x2", xScale1(p4[0]))
        .attr("y2", yScale1(p4[1]));
    svg2_d
        .attr("x1", xScale2(theta))
        .attr("y1", yScale2(0))
        .attr("x2", xScale2(theta))
        .attr("y2", yScale2(d));
    svg2_theta
        .attr("x1", xScale2(0))
        .attr("y1", yScale2(0))
        .attr("x2", xScale2(theta))
        .attr("y2", yScale2(0));
    let rad = xScale1(d)-xScale1(0);
    let offset = rad < 0 ? -90: 90;
    svg1_theta
        .attr("d", d3.arc()
                     .innerRadius(Math.abs(rad))
                     .outerRadius(Math.abs(rad))
                     .startAngle(offset * (Math.PI/180))
                     .endAngle((offset-theta) * (Math.PI/180))
        ).attr("transform", "translate("+xScale1(0)+","+yScale1(0)+")")
	}

	function svg2HoverInsertLines(theta, d){
		svg1_d = svg1.append("line")
	     .attr("id", svg1_id + "-hover-svg1-d")
	     .attr("stroke", "red")
	     .attr("stroke-width", 1.5)
	  svg1_line = svg1.append("line")
	     .attr("id", svg1_id + "-hover-svg1-line")
	     .attr("stroke", "#444")
	     .attr("stroke-width", 1.5)
	  svg2_d = svg2.append("line")
	     .attr("id", svg1_id + "-hover-svg2-d")
	     .attr("stroke", "red")
	     .attr("stroke-width", 1.5)
	  svg2_theta = svg2.append("line")
	     .attr("id", svg1_id + "-hover-svg2-theta")
	     .attr("stroke", "green")
	     .attr("stroke-width", 1.5)
	  svg1_theta = svg1.append("path")
		   .attr("id", svg1_id + "-hover-svg1-theta")
	     .attr("fill", "none").attr("stroke-width", 1.5)
	     .attr("stroke", "green")
		_svg2HoverSetHoverLinePos(theta, d,
			svg1_d, svg1_line, svg2_d, svg2_theta, svg1_theta
		)
	}

	function svg2HoverRemoveLines(){
		d3.select("#" + svg1_id + "-hover-svg1-d").remove()
		d3.select("#" + svg1_id + "-hover-svg1-line").remove()
		d3.select("#" + svg1_id + "-hover-svg2-d").remove()
		d3.select("#" + svg1_id + "-hover-svg2-theta").remove()
		d3.select("#" + svg1_id + "-hover-svg1-theta").remove()
	}

  // top-level event handlers

	function svg2MouseEnter(){
		svg2HoverInsertLines(
			xScale2.invert(d3.mouse(this)[0]),
			yScale2.invert(d3.mouse(this)[1])
		);
	}

	function svg2MouseMove(){
		svg2HoverSetHoverLinePos(
			xScale2.invert(d3.mouse(this)[0]),
			yScale2.invert(d3.mouse(this)[1])
		);
	}

	function svg2MouseLeave(){
		svg2HoverRemoveLines();
	}

	function svg2TouchStart(){
    d3.event.preventDefault();
    d3.event.stopPropagation();
    if (d3.touches(this).length == 1){
      svg2HoverInsertLines(
				xScale2.invert(d3.touches(this)[0][0]),
				yScale2.invert(d3.touches(this)[0][1]) + 4
			);
    }else {
      svg2HoverRemoveLines();
    }
		// two finger scrolling
		if (d3.touches(this).length == 2){
			let touches = d3.touches(document.documentElement)
			last_touch_y_pos = (touches[0][1] + touches[1][1]) / 2;
    }
  }

	function svg2TouchMove(){
    d3.event.preventDefault();
    d3.event.stopPropagation();
    if (d3.touches(this).length == 1){
      svg2HoverSetHoverLinePos(
				xScale2.invert(d3.touches(this)[0][0]),
				yScale2.invert(d3.touches(this)[0][1]) + 4
			);
    }else if (d3.touches(this).length == 2){
			// two finger scrolling
			let touches = d3.touches(document.documentElement)
      let touch_y_pos = (touches[0][1] + touches[1][1]) / 2;
      let diff = touch_y_pos - last_touch_y_pos;
      document.documentElement.scrollTop -= diff;
    }
  }

	function svg2TouchEnd(){
		d3.event.preventDefault();
    d3.event.stopPropagation();
    svg2HoverRemoveLines();
	}
}


function insert_hough_plots_2(svg1_id, svg2_id){
	let x_range = [0, 200]
	let x_range2 = [0, 180]
	let y_range = [0, 200]
	let y_range2 = [300, -300]

	let last_touch_y_pos = 0
	let hover_lines_visible = false;

	// create canvas and div for svg2
	let svg2Div = d3.select("#"+svg2_id)
	                .append("div")
	                .attr("id", svg2_id + "-div")
									.classed('hough-wrapper', true)
									.style("display", "grid")
									.style("grid-template-columns", "1fr")
	let svg2Canvas = svg2Div.append("canvas")
	                        .style("grid-column", "1/2")
													.style("grid-row", "1/2")
													.style("width", "100%")
													.style("height", "100%")
													.style("z-index", "-1")

	let [svg1, xScale1, yScale1] = create_svg("#"+svg1_id, x_range, y_range, "x", "y")
	let [svg2, xScale2, yScale2] = create_svg("#"+svg2_id+"-div", x_range2, y_range2, "Θ", "ρ")
	svg2.style("grid-column", "1/2")
	    .style("grid-row", "1/2")
			.style("display", "block")
			.style("z-index", "1")


	let data = [ [59, 16], [60, 15], [61, 15], [62, 15], [63, 15], [64, 15], [65, 15], [66, 16], [67, 16], [68, 17], [69, 17], [70, 18], [71, 18], [72, 19], [73, 19], [74, 20], [75, 20], [76, 21], [77, 21], [78, 21], [79, 22], [80, 22], [81, 23], [82, 23], [83, 24], [84, 24], [85, 25], [86, 25], [87, 26], [88, 26], [89, 27], [90, 27], [91, 28], [92, 28], [93, 29], [94, 29], [95, 30], [96, 30], [97, 31], [98, 31], [99, 32], [100, 32], [101, 33], [102, 33], [103, 34], [104, 34], [105, 35], [106, 35], [107, 36], [108, 36], [109, 37], [110, 37], [111, 38], [112, 38], [113, 39], [114, 39], [115, 40], [116, 40], [117, 41], [118, 41], [119, 42], [120, 42], [121, 43], [122, 43], [123, 44], [124, 44], [125, 45], [126, 45], [127, 45], [128, 46], [129, 46], [130, 47], [131, 47], [132, 48], [133, 48], [134, 49], [135, 49], [136, 50], [137, 50], [138, 51], [139, 51], [140, 52], [141, 52], [142, 53], [143, 53], [144, 54], [145, 54], [146, 54], [147, 55], [148, 55], [149, 56], [150, 56], [151, 57], [152, 57], [153, 58], [154, 58], [155, 58], [156, 59], [157, 59], [158, 60], [159, 60], [160, 61], [161, 61], [162, 61], [163, 62], [164, 62], [165, 63], [166, 63], [167, 64], [168, 64], [169, 65], [170, 65], [171, 66], [172, 66], [173, 66], [174, 67], [175, 67], [176, 68], [177, 69], [178, 69], [179, 70], [179, 71], [180, 72], [180, 73], [179, 74], [179, 75], [179, 76], [178, 77], [178, 78], [177, 79], [177, 80], [177, 81], [177, 82], [177, 83], [176, 84], [176, 85], [175, 86], [175, 87], [174, 88], [173, 88], [172, 89], [171, 90], [171, 91], [170, 92], [170, 93], [169, 94], [169, 95], [168, 96], [168, 97], [167, 98], [167, 99], [166, 100], [166, 101], [165, 102], [165, 103], [164, 104], [163, 105], [163, 106], [162, 107], [162, 108], [161, 109], [161, 110], [160, 111], [160, 112], [159, 113], [159, 114], [158, 115], [158, 116], [157, 117], [157, 118], [156, 119], [156, 120], [155, 121], [155, 122], [155, 123], [155, 124], [154, 125], [154, 126], [154, 127], [153, 128], [152, 129], [151, 130], [150, 131], [149, 131], [149, 132], [148, 133], [147, 134], [147, 135], [146, 136], [146, 137], [145, 138], [144, 139], [143, 139], [142, 139], [141, 140], [140, 140], [139, 139], [138, 139], [137, 139], [136, 138], [135, 138], [134, 137], [133, 137], [132, 136], [131, 136], [130, 135], [129, 135], [128, 135], [127, 134], [126, 133], [125, 133], [124, 132], [123, 132], [122, 131], [121, 131], [120, 130], [119, 130], [118, 129], [117, 129], [116, 128], [115, 127], [114, 127], [113, 126], [112, 126], [111, 125], [110, 125], [109, 124], [108, 123], [107, 123], [106, 122], [105, 122], [104, 121], [103, 120], [102, 120], [101, 119], [100, 119], [99, 118], [98, 117], [97, 117], [96, 116], [95, 116], [94, 115], [93, 114], [92, 114], [91, 113], [90, 113], [89, 112], [88, 111], [87, 111], [86, 110], [85, 110], [84, 109], [83, 109], [82, 108], [81, 108], [80, 107], [79, 107], [78, 106], [77, 105], [76, 105], [75, 104], [74, 104], [73, 103], [72, 102], [71, 102], [70, 101], [69, 101], [68, 100], [67, 100], [66, 99], [65, 99], [64, 98], [63, 98], [62, 97], [61, 96], [60, 96], [59, 95], [58, 95], [57, 94], [56, 94], [55, 93], [54, 93], [53, 92], [52, 92], [51, 91], [50, 90], [49, 90], [48, 89], [47, 89], [46, 88], [45, 88], [44, 87], [43, 86], [42, 86], [41, 85], [40, 85], [39, 84], [38, 84], [37, 83], [36, 83], [35, 82], [34, 81], [33, 81], [32, 80], [31, 80], [30, 79], [29, 79], [28, 78], [27, 77], [26, 77], [25, 76], [24, 76], [23, 75], [22, 75], [21, 74], [20, 73], [19, 73], [18, 72], [17, 71], [16, 71], [15, 70], [14, 70], [13, 69], [12, 68], [12, 67], [11, 66], [11, 65], [11, 64], [12, 63], [12, 62], [13, 61], [14, 60], [15, 59], [16, 58], [17, 57], [18, 56], [19, 55], [20, 54], [21, 53], [22, 52], [23, 51], [24, 50], [25, 49], [26, 49], [27, 48], [28, 47], [29, 46], [29, 45], [30, 44], [31, 43], [32, 42], [33, 42], [34, 41], [34, 40], [35, 39], [36, 38], [37, 37], [38, 36], [39, 35], [40, 34], [41, 33], [42, 32], [43, 31], [44, 30], [45, 29], [46, 28], [47, 27], [48, 26], [49, 25], [50, 24], [51, 23], [52, 22], [53, 21], [54, 20], [55, 19], [56, 18], [57, 17], [58, 16] ]


  function update_canvas(){
    let w = svg2.node().getBoundingClientRect().width;
    let h = svg2.node().getBoundingClientRect().height;
    svg2Canvas.node().width = w;
    svg2Canvas.node().height = h;
    data.forEach(p => plot_line(p));
  }

	update_canvas()
  window.addEventListener("resize", function() {
      return update_canvas();
  	}
  );

	function plot_line(point){
    scale_factor = svg2.node().getBoundingClientRect().width / w;
    xScaleCanvas = d3.scaleLinear()
                         .domain(x_range2)
                         .range([padding*scale_factor, (w - padding)*scale_factor])
    yScaleCanvas = d3.scaleLinear()
                         .domain(y_range2)
                         .range([padding*scale_factor, (h - padding)*scale_factor]);
    let context = svg2Canvas.node().getContext("2d");
    const line = d3.line()
      .x(d => xScaleCanvas(d))
      .y(d => yScaleCanvas(r(d, point[0], point[1])))
      .context(context);

    context.beginPath();
    line(d3.range(x_range2[0], x_range2[1], .5));
    context.lineWidth = 1;
    context.strokeStyle = "rgba(0, 0, 0, 0.05)";
    context.stroke();
    context.closePath();
  }

	function plot_point(point){
		svg1.append("rect").attr("x", xScale1(point[0]))
											 .attr("y", yScale1(point[1]))
											 .attr("fill", "black")
											 .attr("width", 1.5)
											 .attr("height", 1.5);
	}

	data.forEach(p => plot_point(p));


	svg1.on("mouseenter", svg1MouseEnter)
			.on("mousemove", svg1MouseMove)
			.on("mouseleave", svg1MouseLeave)
			.on("touchstart", svg1TouchStart)
			.on("touchmove", svg1TouchMove)
			.on("touchend", svg1TouchEnd)

	function svg1HoverInsertLines(x, y, show_point){
		if (hover_lines_visible){
			return;
		}
		svg1_point = svg1.append("circle")
					.attr("id", svg1_id + "-hover-point")
					.attr("display", show_point ? "initial": "none")
					.attr("r", 5)
					.attr("fill", "darkred")
		svg2_line = svg2.append("path")
					.attr("id", svg1_id + "-hover-line")
					.datum(d3.range(x_range2[0], x_range2[1], 1))
					.attr("fill", "none")
					.attr("stroke", "darkred")
					.attr("stroke-width", 1.5)
		_svg1HoverSetHoverLinePos(x, y, svg1_point, svg2_line)
		hover_lines_visible = true;
	}

	function _svg1HoverSetHoverLinePos(x, y,
			svg1_point, svg2_line
	){
		svg1_point
			.attr("cx", xScale1(x))
			.attr("cy", yScale1(y))
		svg2_line
			.attr("d", d3.line()
				.x(theta => xScale2(theta))
				.y(theta => yScale2(
						r(theta, x, y)
					)
				)
			)
	}

	function svg1HoverSetHoverLinePos(x, y){
		_svg1HoverSetHoverLinePos(x, y,
			d3.select("#" +  svg1_id + "-hover-point"),
			d3.select("#" +  svg1_id + "-hover-line")
		)
	}

	function svg1HoverRemoveLines(){
		d3.select("#" +  svg1_id + "-hover-line").remove();
		d3.select("#" +  svg1_id + "-hover-point").remove();
		hover_lines_visible = false;
	}

	function svg1MouseEnter(){
		svg1HoverInsertLines(
			xScale1.invert(d3.mouse(this)[0]),
			yScale1.invert(d3.mouse(this)[1]),
			false
		)
	}

	function svg1MouseMove(){
		svg1HoverSetHoverLinePos(
			xScale1.invert(d3.mouse(this)[0]),
			yScale1.invert(d3.mouse(this)[1])
		)
	}

	function svg1MouseLeave(){
		svg1HoverRemoveLines();
	}

	function svg1TouchStart(){
		d3.event.preventDefault();
		d3.event.stopPropagation();
		if (d3.touches(this).length == 1){
			svg1HoverInsertLines(
				xScale1.invert(d3.touches(this)[0][0]),
				yScale1.invert(d3.touches(this)[0][1]) - 40,
				true
			);
		}else {
			svg1HoverRemoveLines();
		}
		// two finger scrolling
		if (d3.touches(this).length == 2){
			let touches = d3.touches(document.documentElement)
			last_touch_y_pos = (touches[0][1] + touches[1][1]) / 2;
		}
	}

	function svg1TouchEnd(){
		d3.event.preventDefault();
		d3.event.stopPropagation();
		svg1HoverRemoveLines();
	}

	function svg1TouchMove(){
		d3.event.preventDefault();
		d3.event.stopPropagation();
		if (d3.touches(this).length == 1){
			svg1HoverSetHoverLinePos(
				xScale1.invert(d3.touches(this)[0][0]),
				yScale1.invert(d3.touches(this)[0][1]) - 40
			);
		}else if (d3.touches(this).length == 2){
			// two finger scrolling
			let touches = d3.touches(document.documentElement)
			let touch_y_pos = (touches[0][1] + touches[1][1]) / 2;
			let diff = touch_y_pos - last_touch_y_pos;
			document.documentElement.scrollTop -= diff;
		}
	}


	svg2.on("touchstart", svg2TouchStart)
			.on("touchmove", svg2TouchMove)
			.on("touchend", svg2TouchEnd)
			.on("mouseenter", svg2MouseEnter)
			.on("mousemove", svg2MouseMove)
			.on("mouseleave", svg2MouseLeave);



	function svg2HoverSetHoverLinePos(theta, d){
		_svg2HoverSetHoverLinePos(theta, d,
			d3.select("#" + svg1_id + "-hover-svg1-line"),
			d3.select("#" + svg1_id + "-hover-svg2-point"),
		)
	}

	function _svg2HoverSetHoverLinePos(theta, d,
			svg1_line, svg2_point
	){
		var p2 = [Math.cos(theta*2*Math.PI/360)*d, Math.sin(theta*2*Math.PI/360)*d];
		var p3 = [p2[0] + Math.cos((theta-90)*2*Math.PI/360)*600,
							p2[1] + Math.sin((theta-90)*2*Math.PI/360)*600]
		var p4 = [p2[0] + Math.cos((theta+90)*2*Math.PI/360)*600,
							p2[1] + Math.sin((theta+90)*2*Math.PI/360)*600]
		svg1_line
				.attr("x1", xScale1(p3[0]))
				.attr("y1", yScale1(p3[1]))
				.attr("x2", xScale1(p4[0]))
				.attr("y2", yScale1(p4[1]));
		svg2_point
				.attr("cx", xScale2(theta))
				.attr("cy", yScale2(d));
	}

	function svg2HoverInsertLines(theta, d, show_point){
		svg1_line = svg1.append("line")
			 .attr("id", svg1_id + "-hover-svg1-line")
			 .attr("stroke", "darkred")
			 .attr("stroke-width", 1.5)
		svg2_point = svg2.append("circle")
					.attr("id", svg1_id + "-hover-svg2-point")
					.attr("display", show_point ? "initial": "none")
					.attr("r", 5)
					.attr("fill", "darkred")
		_svg2HoverSetHoverLinePos(theta, d,
			svg1_line, svg2_point
		)
	}

	function svg2HoverRemoveLines(){
		d3.select("#" + svg1_id + "-hover-svg1-line").remove()
		d3.select("#" + svg1_id + "-hover-svg2-point").remove()
	}

	// top-level event handlers

	function svg2MouseEnter(){
		svg2HoverInsertLines(
			xScale2.invert(d3.mouse(this)[0]),
			yScale2.invert(d3.mouse(this)[1]),
			false
		);
	}

	function svg2MouseMove(){
		svg2HoverSetHoverLinePos(
			xScale2.invert(d3.mouse(this)[0]),
			yScale2.invert(d3.mouse(this)[1])
		);
	}

	function svg2MouseLeave(){
		svg2HoverRemoveLines();
	}

	function svg2TouchStart(){
		d3.event.preventDefault();
		d3.event.stopPropagation();
		if (d3.touches(this).length == 1){
			svg2HoverInsertLines(
				xScale2.invert(d3.touches(this)[0][0]),
				yScale2.invert(d3.touches(this)[0][1]) + 120,
				true
			);
		}else {
			svg2HoverRemoveLines();
		}
		// two finger scrolling
		if (d3.touches(this).length == 2){
			let touches = d3.touches(document.documentElement)
			last_touch_y_pos = (touches[0][1] + touches[1][1]) / 2;
		}
	}

	function svg2TouchMove(){
		d3.event.preventDefault();
		d3.event.stopPropagation();
		if (d3.touches(this).length == 1){
			svg2HoverSetHoverLinePos(
				xScale2.invert(d3.touches(this)[0][0]),
				yScale2.invert(d3.touches(this)[0][1]) + 120
			);
		}else if (d3.touches(this).length == 2){
			// two finger scrolling
			let touches = d3.touches(document.documentElement)
			let touch_y_pos = (touches[0][1] + touches[1][1]) / 2;
			let diff = touch_y_pos - last_touch_y_pos;
			document.documentElement.scrollTop -= diff;
		}
	}

	function svg2TouchEnd(){
		d3.event.preventDefault();
		d3.event.stopPropagation();
		svg2HoverRemoveLines();
	}
}
