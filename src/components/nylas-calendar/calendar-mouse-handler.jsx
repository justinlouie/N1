/** @babel */
import moment from 'moment'

import React from 'react'

export default class CalendarMouseHandler extends React.Component {
  static displayName = "CalendarMouseHandler";

  static propTypes = {
    interactionHandlers: React.PropTypes.objectOf(React.PropTypes.func),
  }

  static defaultProps = {
    interactionHandlers: {},
  }

  componentDidMount() {
    window.addEventListener("mouseup", this._onWindowMouseUp)
  }

  componentWillUnmount() {
    window.removeEventListener("mouseup", this._onWindowMouseUp)
  }

  _supportedEvents() {
    return [
      "onMouseDown",
      "onMouseMove",
      "onMouseUp",
    ]
  }

  _mouseCallbacks() {
    const mouseCallbacks = {}
    for (const eventName of this._supportedEvents()) {
      const pluginFn = this.props.interactionHandlers[eventName]
      if (pluginFn) {
        mouseCallbacks[eventName] = (event) => {
          if (eventName === "onMouseDown") {
            this._clientRectCache = null;
            this._mouseIsDown = true;
          } else if (eventName === "onMouseUp") {
            this._clientRectCache = null;
            this._mouseIsDown = false;
          } else if (eventName === "onMouseMove") {
            if (!this._mouseIsDown) {
              return
            }
          }
          const time = this._timeFromMouseEvent(event);
          try {
            pluginFn(event, time)
          } catch (error) {
            NylasEnv.reportError(error)
          }
        }
      }
    }
    return mouseCallbacks
  }

  _timeFromMouseEvent(event) {
    if (!event.target || !event.target.closest) { return null }
    const col = event.target.closest(".event-column");
    const wrap = event.target.closest(".event-grid-wrap");
    if (!wrap || !col) { return null }

    const rect = this._clientRectCache || wrap.getBoundingClientRect()
    const percentDay = (wrap.scrollTop + event.clientY - rect.top) / wrap.scrollHeight;
    return moment(((+col.dataset.end) - (+col.dataset.start)) * percentDay + (+col.dataset.start))
  }

  _onWindowMouseUp = (event) => {
    if (React.findDOMNode(this).contains(event.target)) {
      return
    }
    const mouseUp = this._mouseCallbacks().onMouseUp
    if (mouseUp) { mouseUp(event) }
  }

  render() {
    return (
      <div className="calendar-mouse-handler" {...this._mouseCallbacks()}>
        {this.props.children}
      </div>
    )
  }
}
