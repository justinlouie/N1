import React from 'react'
import ProposedTimeStore from './proposed-time-store'

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
    if (this.props.event.calendarId === ProposedTimeStore.CALENDAR_ID()) {
      return <div className="rm-time" onClick={this._onClick}>&times;</div>
    }
    return false
  }
}
