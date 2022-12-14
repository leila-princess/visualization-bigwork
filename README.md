# 内容描述
本实验的主题是霍夫变换的可视化，文章所介绍的霍夫变换是一种特征提取，被广泛应用在图像分析、计算机视觉等方面。霍夫变换主要是用来辨别找出物件中的特征，例如线条或图形。他的算法流程大致如下：给定一个物件以及要辨别的形状的种类，算法会在参数空间中执行投票来决定物体的形状，这由累加空间里的局部最大值来决定。

变换的主要操作是，对于(x, y)空间上的某个点(x1, y1)有y1 = m*x1 + c，则ρ = x*cosΘ + ysinΘ，这是霍夫空间上的一条直线。对于(x, y)空间上某条直线的方程为ρ1 = x*cosΘ1 + ysinΘ1，则也就是霍夫空间上的一个点(ρ1, Θ1)。也就是说将(x, y)空间的点和直线变换为 (ρ, Θ)空间的直线和点。而“投票”则是指统计霍夫空间中线的交点次数，选择由尽可能多直线汇成的点，得到原空间中的图形。

我们可视化采用的是直角坐标系与霍夫空间的转换，直角坐标系(x, y)空间上的直线对应在(r, Θ)空间是点，但是直角坐标系(x, y)空间上的点对应在(r, Θ)空间是正弦曲线。同样采用“投票”机制，(r, Θ)空间下，两条正弦曲线相交一个点，这个交点就是对应(x, y)空间上穿过两条正弦曲线对应的点的直线。对于一幅像素图，对每个点做出霍夫变换后的正弦曲线，通过统计曲线交点就可以在霍夫空间中找到对应原空间直线的点。


# 主要文件描述
### static
页面插入的图片等src文件
### hough.js
页面交互动作的实现文件，包括svg1、svg2、svg3、svg4可视化交互
### index.html
主页面设计

## page文件夹
### index1.html
try out 跳转界面
### examples文件夹
#### 1.html
霍夫变换交互体验界面
#### 2.html
霍夫变换实际应用界面
#### 3.html
”直角坐标系与霍夫空间“关系展示界面
#### pages.css
每个页面相应所需的样式
#### hough.js
页面交互动作的实现文件，包括可视化交互

# 应用展示
下载webstorm等软件打开代码，运行index.html主界面，点击各项按钮进行页面跳转，并按照指示进行可视化交互。
