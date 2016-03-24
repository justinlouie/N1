import React from 'react'

export default class EventGridBg extends React.Component {
  static displayName = "EventGridBg";

  static propTypes = {
    height: React.PropTypes.number,
    numColumns: React.PropTypes.number,
    tickGenerator: React.PropTypes.func,
    intervalHeight: React.PropTypes.number,
  }

  constructor() {
    super();
    this._lastHoverRect = {}
  }

  componentDidMount() {
    this._renderEventGridBg()
  }

  componentDidUpdate() {
    this._renderEventGridBg()
  }

  _renderEventGridBg() {
    const canvas = React.findDOMNode(this.refs.canvas);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const height = this.props.height;
    canvas.height = height;

    const doStroke = (type, strokeStyle) => {
      ctx.strokeStyle = strokeStyle;
      ctx.beginPath();
      for (const {yPos} of this.props.tickGenerator({type: type})) {
        ctx.moveTo(0, yPos);
        ctx.lineTo(canvas.width, yPos);
      }
      ctx.stroke();
    }

    doStroke("minor", "#f1f1f1"); // Minor Ticks
    doStroke("major", "#e0e0e0"); // Major ticks
  }

  mouseMove({x, y, width}) {
    if (!width || x == null || y == null) { return }
    const lr = this._lastHoverRect;
    const xInt = width / this.props.numColumns
    const yInt = this.props.intervalHeight
    const r = {
      x: Math.floor(x / xInt) * xInt + 1,
      y: Math.floor(y / yInt) * yInt + 1,
      width: xInt - 2,
      height: yInt - 2,
    }
    if (lr.x === r.x && lr.y === r.y && lr.width === r.width) {
      return
    }
    this._lastHoverRect = r;
    const cursor = React.findDOMNode(this.refs.cursor);
    cursor.style.left = `${r.x}px`;
    cursor.style.top = `${r.y}px`;
    cursor.style.width = `${r.width}px`;
    cursor.style.height = `${r.height}px`;
  }

  render() {
    const styles = {
      width: "100%",
      height: this.props.height,
    }
    return (
      <div className="event-grid-bg-wrap">
        <div ref="cursor" className="cursor"></div>
        <canvas ref="canvas"
                className="event-grid-bg" style={styles}></canvas>
      </div>
    )
  }
}
