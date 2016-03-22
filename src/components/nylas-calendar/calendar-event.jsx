import React from 'react'
import classnames from 'classnames'
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
    const size = Math.min((duration - this._overflowBefore()) / scopeLen, 1);

    let minorDim = 1;
    let minorPos;
    if (this.props.fixedMinorDimension === -1) {
      minorDim = 1 / this.props.concurrentEvents;
      minorPos = minorDim * (this.props.order - 1);
      minorDim = `${minorDim * 100}%`;
      minorPos = `${minorPos * 100}%`;
    } else {
      minorDim = this.props.fixedMinorDimension
      minorPos = this.props.fixedMinorDimension * (this.props.order - 1);
    }

    let bgColor = NylasEnv.config.get(`calendar.colors.${this.props.event.calendarId}`)
    if (!bgColor) {
      const hue = Utils.hueForString(this.props.event.calendarId);
      bgColor = `hsla(${hue}, 50%, 45%, 0.35)`
    }

    const styles = {
      backgroundColor: bgColor,
    }
    styles[posDir] = `${pos * 100}%`
    styles[sizeDir] = `${size * 100}%`
    styles[minorDimDir] = minorDim
    styles[minorDimPos] = minorPos

    return styles
  }

  _overflowBefore() {
    return Math.max(this.props.scopeStart - this.props.event.start, 0)
  }

  _overflowAfter() {
    return Math.max(this.props.event.end - this.props.scopeEnd, -1)
  }

  _classNames() {
    const cnames = {
      "calendar-event": true,
      "overflow-before": (this._overflowBefore() > 0),
      "overflow-after": (this._overflowAfter() > 0),
    };
    cnames[this.props.direction] = true;
    return classnames(cnames)
  }

  render() {
    console.log(this.props.event.title)
    return (
      <div className={`calendar-event ${this.props.direction}`}
           style={this._styles()}>
        {this.props.event.title}
      </div>
    )
  }
}
