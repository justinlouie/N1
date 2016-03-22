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

  constructor() {
    super()
    this._DOMCache = {}
  }

  componentDidMount() {
    this._DOMCache = {};
    window.addEventListener("mouseup", this._onWindowMouseUp)
  }

  componentDidUpdate() {
    this._DOMCache = {};
  }

  componentWillUnmount() {
    this._DOMCache = {};
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
            this._DOMCache = {};
            this._mouseIsDown = true;
          } else if (eventName === "onMouseUp") {
            this._DOMCache = {};
            this._mouseIsDown = false;
          }
          const {time, x, y, width, height} = this._dataFromMouseEvent(event);
          try {
            pluginFn({event, time, x, y, width, height, mouseIsDown: this._mouseIsDown})
          } catch (error) {
            NylasEnv.reportError(error)
          }
        }
      }
    }
    return mouseCallbacks
  }

  _dataFromMouseEvent(event) {
    let x = null;
    let y = null;
    let width = null;
    let height = null;
    let time = null;
    if (!event.target || !event.target.closest) { return {x, y, width, height, time} }
    const eventColumn = this._DOMCache.eventColumn || event.target.closest(".event-column");
    const gridWrap = this._DOMCache.gridWrap || event.target.closest(".event-grid-wrap");
    const calWrap = this._DOMCache.calWrap || event.target.closest(".calendar-area-wrap")
    if (!gridWrap || !eventColumn) { return {x, y, width, height, time} }

    const rect = this._DOMCache.rect || gridWrap.getBoundingClientRect();
    const calWrapRect = this._DOMCache.calWrapRect || calWrap.getBoundingClientRect();

    this._DOMCache = {rect, eventColumn, gridWrap, calWrap}

    y = (gridWrap.scrollTop + event.clientY - rect.top);
    x = (calWrap.scrollLeft + event.clientX - calWrapRect.left);
    width = gridWrap.scrollWidth;
    height = gridWrap.scrollHeight;
    const percentDay = y / height;
    time = moment(((+eventColumn.dataset.end) - (+eventColumn.dataset.start)) * percentDay + (+eventColumn.dataset.start));
    return {x, y, width, height, time}
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
