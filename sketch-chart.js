const PADDING = 5;
const MODE_ADJUSTMENT = 1;
const MODE_DRAWING = 2;

class SketchChart {

  constructor(targetSVG, segments=10) {
    this.svg = d3.select(targetSVG);
    this.dimension = this.svg.node().getBoundingClientRect();
    this.canvas = this.svg.append('g');
    this.segments = segments;

    this.H = this.dimension.height - 2*PADDING;
    this.W = this.dimension.width - 2*PADDING;
    this.points = [];
    this.buffer = [];
    this.mode = 0;

    this.interval = this.W / this.segments; 
    this.chartData = d3.range(0, this.W, this.interval).map(() => 0); // 0 default

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
      _this.buffer = [];
      _this.mode = 0;


      rect.on('mousemove', function() {
        const p = d3.mouse(_this.canvas.node());
        const points = _this.points;
        const buffer = _this.buffer;

        if (_this.mode === 0) {
          buffer.push({x: p[0], y: p[1]});

          if (buffer.length >= 3) {
            const dy1 = buffer[1].y - buffer[0].y;
            const dy2 = buffer[2].y - buffer[1].y;
            const dx1 = buffer[1].x - buffer[0].x;
            const dx2 = buffer[2].x - buffer[1].x;

            if (Math.abs(dy1/dx1) > 1.5 && Math.abs(dy2/dx2) > 1.5) {
              _this.mode = MODE_ADJUSTMENT;
            } else {
              _this.mode = MODE_DRAWING;
            }
            console.log('determining mode', _this.mode);
          }
          return;
        }

        const len = points.length;
        if (_this.mode === MODE_DRAWING) {
          if (len > 2) {
            const directionChanged = (points[len-1].x  - points[len-2].x) * (p[0] - points[len-1].x)
            if (directionChanged <= 0) return;
          }
          points.push({x: p[0], y: p[1]});
          _this.renderPoints();
        } else if (_this.mode === MODE_ADJUSTMENT) {
          if (len > 2) {
            const index = parseInt(buffer[0].x / _this.interval);
            const dy = (p[1] - points[len-1].y);
            _this.chartData[index] -= dy;
          }
          points.push({x: p[0], y: p[1]});
          _this.renderChart();
        }

      });

    });
  }

  renderPoints() {
    if (this.points.length < 2) return;

    console.log('rendering points');

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
    const interval = this.interval;

    if (this.mode === MODE_DRAWING) {
      // Calculate
      const temp = d3.range(0, this.W, interval).map(() => []);

      // TODO: interploate

      this.points.forEach(p => {
        const index = parseInt(p.x / interval);
        temp[index].push(this.H - p.y);
      });

      this.chartData = temp.map(t => {
        return t.length === 0 ? 0 : d3.mean(t);
      });
    }

    // Render
    this.canvas.selectAll('.chart-data').remove();
    this.canvas.selectAll('.chart-data')
      .data(this.chartData)
      .enter()
      .append('rect')
      .classed('chart-data', true)
      .attr('x', (d, i) => i*interval)
      .attr('y', (d, i) => this.H - d)
      .attr('width', interval)
      .attr('height', (d, i) => d)
      .style('fill', '#f80')
      .style('fill-opacity', 0.5)
      .style('pointer-events', 'none');
  }

  rescale() {
  }

}
