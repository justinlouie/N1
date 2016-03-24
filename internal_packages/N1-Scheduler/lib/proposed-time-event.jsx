import React from 'react'
import {CALENDAR_ID} from './scheduler-constants'

/**
 * Gets rendered in a CalendarEvent
 */
export default class ProposedTimeEvent extends React.Component {
  static displayName = "ProposedTimeEvent";

  static propTypes = {
    event: React.PropTypes.object,
  }

  _onClick() {
    // TODO
  }

  render() {
    if (this.props.event.calendarId === CALENDAR_ID) {
      return <div className="rm-time" onClick={this._onClick}>&times;</div>
    }
    return false
  }
}
