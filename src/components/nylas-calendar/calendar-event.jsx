import React from 'react'
import moment from 'moment'
import {Event, Utils} from 'nylas-exports'

export default class CalendarEvent extends React.Component {
  static displayName = "CalendarEvent";

  static propTypes = {
    event: React.PropTypes.instanceOf(Event).isRequired,
    order: React.PropTypes.number,
    scopeEnd: React.PropTypes.number.isRequired,
    scopeStart: React.PropTypes.number.isRequired,
    direction: React.PropTypes.oneOf(['horizontal', 'vertical']),
    concurrentEvents: React.PropTypes.number,
    fixedMinorDimension: React.PropTypes.number,
  }

  static defaultProps = {
    order: 1,
    direction: "vertical",
    concurrentEvents: 1,
    fixedMinorDimension: -1,
  }

  _styles() {
    const scopeLen = this.props.scopeEnd - this.props.scopeStart
    const duration = this.props.event.end - this.props.event.start;

    let posDir = "top"
    let sizeDir = "height"
    let minorDimPos = "left"
    let minorDimDir = "width"

    if (this.props.direction === "horizontal") {
      sizeDir = "width";
      posDir = "left"
      minorDimDir = "height"
      minorDimPos = "top"
    }

    const pos = Math.max((this.props.event.start - this.props.scopeStart) / scopeLen, 0);
    const size = Math.min(duration / scopeLen, 1);

    let minorDim = 1;
    let minorPos;
    if (this.fixedMinorDimension === -1) {
      minorDim = (1 / this.props.concurrentEvents);
      minorPos = minorDim * (this.props.order - 1);
    } else {
      minorPos = this.props.fixedMinorDimension * (this.props.order - 1);
    }

    const hue = Utils.hueForString(this.props.event.calendarId);
    const bgColor = `hsla(${hue}, 50%, 45%, 0.35)`

    const styles = {
      backgroundColor: bgColor,
    }
    styles[posDir] = `${pos * 100}%`
    styles[sizeDir] = `${size * 100}%`
    styles[minorDimDir] = `${minorDim * 100}%`
    styles[minorDimPos] = `${minorPos * 100}%`

    return styles
  }

  render() {
    return (
      <div className="calendar-event" style={this._styles()}>
        {this.props.event.title}
      </div>
    )
  }
}
