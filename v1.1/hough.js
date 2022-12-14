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


	let data = [[5, 22], [6, 23], [8, 25], [9, 26], [10, 27], [11, 28], [12, 29], [81, 29], [13, 30], [82, 30], [127, 30], [14, 31], [83, 31], [15, 32], [84, 33], [130, 33], [67, 34], [85, 34], [114, 34], [18, 35], [68, 35], [86, 35], [112, 35], [115, 35], [19, 36], [69, 36], [87, 36], [111, 36], [112, 36], [116, 36], [117, 36], [20, 37], [70, 37], [88, 37], [111, 37], [118, 37], [119, 37], [21, 38], [89, 38], [110, 38], [119, 38], [120, 38], [22, 39], [90, 39], [109, 39], [110, 39], [121, 39],  [122, 39], [23, 40], [91, 40], [109, 40], [122, 40], [123, 40], [24, 41], [92, 41], [108, 41], [124, 41], [139, 41], [25, 42], [26, 42], [76, 42], [107, 42], [125, 42], [126, 42], [26, 43], [27, 43], [94, 43], [107, 43], [127, 43], [27, 44], [28, 44], [95, 44], [106, 44], [128, 44], [28, 45], [29, 45], [96, 45], [105, 45], [130, 45], [29, 46], [30, 46], [97, 46], [104, 46], [105, 46], [131, 46], [132, 46], [30, 47], [31, 47], [98, 47], [104, 47], [133, 47], [31, 48], [32, 48], [99, 48], [103, 48], [134, 48], [135, 48], [32, 49], [100, 49], [102, 49], [103, 49], [136, 49], [33, 50], [102, 50], [137, 50], [138, 50], [34, 51], [101, 51], [139, 51], [140, 51], [35, 52], [100, 52], [140, 52], [141, 52], [142, 52], [36, 53], [100, 53], [142, 53], [143, 53], [144, 53], [37, 54], [99, 54], [144, 54], [145, 54], [98, 55], [146, 55], [147, 55], [39, 56], [97, 56], [98, 56], [147, 56], [148, 56], [149, 56], [40, 57], [97, 57], [149, 57], [150, 57], [151, 57], [41, 58], [96, 58], [151, 58], [152, 58], [153, 58], [42, 59], [95, 59], [153, 59], [154, 59], [155, 59], [43, 60], [95, 60], [155, 60], [156, 60], [44, 61], [94, 61], [157, 61], [45, 62], [93, 62], [157, 62], [158, 62], [46, 63], [92, 63], [93, 63], [157, 63], [47, 64], [74, 64], [75, 64], [92, 64], [156, 64], [157, 64], [48, 65], [75, 65], [76, 65], [91, 65], [156, 65], [49, 66], [76, 66], [90, 66], [91, 66], [155, 66], [156, 66], [50, 67], [51, 67], [90, 67], [154, 67], [155, 67], [51, 68], [89, 68], [154, 68], [52, 69], [88, 69], [153, 69], [154, 69], [53, 70], [80, 70], [88, 70], [153, 70], [54, 71], [81, 71], [87, 71], [152, 71], [153, 71], [55, 72], [78, 72], [82, 72], [86, 72], [151, 72], [152, 72], [83, 73], [86, 73], [151, 73], [85, 74], [150, 74], [80, 75], [81, 75], [84, 75], [149, 75], [150, 75], [81, 76], [83, 76], [84, 76], [149, 76], [83, 77], [148, 77], [61, 78], [82, 78], [147, 78], [148, 78], [62, 79], [81, 79], [147, 79], [81, 80], [146, 80], [64, 81], [80, 81], [146, 81], [65, 82], [79, 82], [145, 82], [66, 83], [79, 83], [144, 83], [145, 83], [67, 84], [78, 84], [144, 84], [77, 85], [143, 85], [76, 86], [77, 86], [143, 86], [76, 87], [142, 87], [72, 88], [75, 88], [141, 88], [72, 89], [74, 89], [75, 89], [140, 89], [141, 89], [74, 90], [140, 90], [73, 91], [139, 91], [140, 91], [72, 92], [73, 92], [138, 92], [139, 92], [72, 93], [138, 93], [71, 94], [137, 94], [70, 95], [137, 95], [69, 96], [70, 96], [136, 96], [69, 97], [135, 97], [136, 97], [68, 98], [135, 98], [67, 99], [68, 99], [134, 99], [67, 100], [133, 100], [134, 100], [66, 101], [133, 101], [65, 102], [132, 102], [133, 102], [135, 102], [136, 102], [64, 103], [65, 103], [131, 103], [132, 103], [136, 103], [64, 104], [131, 104], [137, 104], [63, 105], [130, 105], [131, 105], [138, 105], [62, 106], [63, 106], [130, 106], [139, 106], [62, 107], [129, 107], [139, 107], [61, 108], [128, 108], [129, 108], [60, 109], [61, 109], [128, 109], [59, 110], [60, 110], [127, 110], [59, 111], [126, 111], [58, 112], [59, 112], [126, 112], [57, 113], [58, 113], [125, 113], [57, 114], [124, 114], [125, 114], [56, 115], [124, 115], [55, 116], [56, 116], [123, 116], [55, 117], [123, 117], [54, 118], [122, 118], [127, 118], [53, 119], [54, 119], [121, 119], [123, 119], [124, 119], [52, 120], [53, 120], [121, 120], [125, 120], [52, 121], [120, 121], [126, 121], [51, 122], [52, 122], [119, 122], [127, 122], [50, 123], [51, 123], [119, 123], [128, 123], [166, 123], [50, 124], [118, 124], [129, 124], [167, 124], [49, 125], [117, 125], [118, 125], [48, 126], [49, 126], [117, 126], [47, 127], [48, 127], [116, 127], [47, 128], [115, 128], [116, 128], [47, 129], [48, 129], [115, 129], [48, 130], [49, 130], [50, 130], [114, 130], [115, 130], [50, 131], [51, 131], [52, 131], [114, 131], [173, 131], [52, 132], [53, 132], [113, 132], [53, 133], [54, 133], [55, 133], [112, 133], [113, 133], [139, 133], [55, 134], [56, 134], [112, 134], [56, 135], [57, 135], [58, 135], [111, 135], [58, 136], [59, 136], [110, 136], [111, 136], [142, 136], [60, 137], [61, 137], [109, 137], [110, 137], [61, 138], [62, 138], [63, 138], [109, 138], [63, 139], [64, 139], [108, 139], [65, 140], [66, 140], [108, 140], [66, 141], [67, 141], [107, 141], [68, 142], [69, 142], [106, 142], [107, 142], [69, 143], [70, 143], [106, 143], [71, 144], [72, 144], [105, 144], [106, 144], [2, 145], [3, 145], [72, 145], [73, 145], [105, 145], [3, 146], [4, 146], [74, 146], [75, 146], [104, 146], [4, 147], [76, 147], [77, 147], [104, 147], [5, 148], [77, 148], [78, 148], [103, 148], [5, 149], [6, 149], [79, 149], [80, 149], [102, 149], [103, 149], [6, 150], [80, 150], [81, 150], [101, 150], [102, 150], [82, 151], [83, 151], [101, 151], [83, 152], [84, 152], [100, 152], [85, 153], [86, 153], [99, 153], [100, 153], [86, 154], [87, 154], [99, 154], [88, 155], [89, 155], [98, 155], [89, 156], [90, 156], [98, 156], [91, 157], [92, 157], [97, 157], [92, 158], [93, 158], [94, 159], [95, 159], [169, 160], [177, 167]]


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
