import React from 'react'
import moment from 'moment'
import {Event} from 'nylas-exports'

export default class CalendarEvent extends React.Component {
  static displayName = "CalendarEvent";

  static propTypes = {
    event: React.PropTypes.instanceOf(Event).isRequired,
    order: React.PropTypes.number,
    dayStart: React.PropTypes.number.isRequired,
    concurrentEvents: React.PropTypes.number,
  }

  static defaultProps = {
    order: 1,
    concurrentEvents: 1,
  }

  _styles() {
    const dayLen = moment.duration(1, 'day').subtract(1, 'second').as('seconds');
    const duration = this.props.event.end - this.props.event.start;
    const top = Math.max((this.props.event.start - this.props.dayStart) / dayLen, 0);
    const height = Math.min(duration / dayLen, 1);
    const width = (1 / this.props.concurrentEvents);
    const left = width * this.props.order;
    return {
      top: `${top}%`,
      left: `${left}%`,
      width: `${width}%`,
      height: `${height}%`,
    }
  }

  render() {
    return (
      <div className="calendar-event" style={this._styles()}>
        {this.props.event.title}
      </div>
    )
  }
}
