const PADDING = 5;

class SketchChart {

  constructor(targetSVG, segments=10) {
    this.svg = d3.select(targetSVG);
    this.dimension = this.svg.node().getBoundingClientRect();
    this.canvas = this.svg.append('g');
    this.segments = segments;

    this.H = this.dimension.height - 2*PADDING;
    this.W = this.dimension.width - 2*PADDING;
    this.points = [];

    const rect = this.canvas.append('rect')
    rect.attr('x', PADDING)
      .attr('y', PADDING)
      .attr('width', this.W)
      .attr('height', this.H)
      .style('fill', '#eee')
      .style('stroke', '#ddd');
     
    const _this = this;
    rect.on('mouseup', function() {
      console.log('mouse up');
      rect.on('mousemove', null);
      _this.renderChart();
    });

    rect.on('mousedown', function() {
      d3.event.preventDefault();
      _this.points = [];

      rect.on('mousemove', function() {
        const p = d3.mouse(_this.canvas.node());
        const len = _this.points.length;
        if (len > 2) {
          const directionChanged = (_this.points[len-1].x  - _this.points[len-2].x) * (p[0] - _this.points[len-1].x)
          if (directionChanged <= 0) return;
        }
        _this.points.push({x: p[0], y: p[1]});
        _this.renderPoints();
      });

    });
  }

  renderPoints() {
    if (this.points.length < 2) return;

    this.canvas.selectAll('.points').remove();
    for (let i=0; i < this.points.length - 1; i++) {
      this.canvas.append('line')
        .classed('points', true)
        .attr('x1', this.points[i].x)
        .attr('y1', this.points[i].y)
        .attr('x2', this.points[i+1].x)
        .attr('y2', this.points[i+1].y)
        .style('stroke', '#F40')
        .style('stroke-width', 2)
        .style('pointer-events', 'none');
    }
  }


  renderChart() {
    // Calculate
    const interval = this.W / this.segments;
    const chartData = d3.range(0, this.W, interval).map(() => []);

    // TODO: interploate

    this.points.forEach(p => {
      const index = parseInt(p.x / interval);
      chartData[index].push(p.y);
    });

    // Render
    this.canvas.selectAll('.chart-data').remove();
    this.canvas.selectAll('.chart-data')
      .data(chartData)
      .enter()
      .append('rect')
      .classed('chart-data', true)
      .attr('x', (d, i) => i*interval)
      .attr('y', (d, i) => (d.length === 0 ? (this.H - 2) : d3.mean(d)))
      .attr('width', interval)
      .attr('height', (d, i) => d.length === 0 ? 2 : (this.H - d3.mean(d)))
      .style('fill', '#f80')
      .style('fill-opacity', 0.5)
      .style('pointer-events', 'none');
  }

  rescale() {
  }

}
