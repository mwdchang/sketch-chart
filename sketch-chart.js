const PADDING = 0;
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
      .style('fill', '#f8f8f8')
      .style('stroke', '#f8f8f8');


    this.renderChart();
     
    const _this = this;
    rect.on('mouseup', function() {
      console.log('mouse up');
      rect.on('mousemove', null);
      _this.canvas.selectAll('.outline').remove();
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

        const SLOPE_THRESHOLD = 20;

        if (_this.mode === 0) {
          buffer.push({x: p[0], y: p[1]});

          const bufferLen = buffer.length;
          if (bufferLen >= 5) {
            const dy1 = buffer[bufferLen-1].y - buffer[bufferLen-2].y;
            const dx1 = buffer[bufferLen-1].x - buffer[bufferLen-2].x;
            const dy2 = buffer[bufferLen-2].y - buffer[bufferLen-3].y;
            const dx2 = buffer[bufferLen-2].x - buffer[bufferLen-3].x;

            if ((Math.abs(dx1) < 0.01 && Math.abs(dx2) < 0.01) || (Math.abs(dy1/dx1) > SLOPE_THRESHOLD && Math.abs(dy2/dx2) > SLOPE_THRESHOLD)) {
              _this.mode = MODE_ADJUSTMENT;
            } else {
              _this.mode = MODE_DRAWING;
              buffer.forEach(p => points.push(p));
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

            _this.canvas.selectAll('.outline').remove();
            _this.canvas.append('rect')
              .classed('outline', true)
              .attr('x', index * _this.interval)
              .attr('y', 2)
              .attr('width', _this.interval)
              .attr('height', _this.H - 2)
              .style('stroke', '#0CC')
              .style('stroke-width', 2)
              .style('fill', 'none');

            const dy = (p[1] - points[len-1].y);
            _this.chartData[index] -= dy;
            if (_this.chartData[index] < 0) {
              _this.chartData[index] = 0;
            }
          }
          points.push({x: p[0], y: p[1]});
          _this.renderChart();
        }

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
        .style('stroke', '#2C8')
        .style('stroke-width', 3)
        .style('pointer-events', 'none');
    }
  }


  renderChart() {
    const interval = this.interval;

    this.canvas.selectAll('.chart-data-guide').remove();
    this.canvas.selectAll('.chart-data-guide')
      .data(this.chartData)
      .enter()
      .append('line')
      .classed('chart-data-guide', true)
      .attr('x1', (d, i) => i*interval)
      .attr('y1', 0)
      .attr('x2', (d, i) => i*interval)
      .attr('y1', this.H)
      .style('stroke', '#ddd');

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
    const padding = 2;
    this.canvas.selectAll('.chart-data').remove();
    this.canvas.selectAll('.chart-data')
      .data(this.chartData)
      .enter()
      .append('rect')
      .classed('chart-data', true)
      .attr('x', (d, i) => i*interval + padding)
      .attr('y', (d, i) => this.H - d)
      .attr('width', interval - 2 * padding)
      .attr('height', (d, i) => d)
      .style('fill', '#f80')
      .style('fill-opacity', 0.5)
      .style('pointer-events', 'none');
  }

  rescale() {
  }

}
