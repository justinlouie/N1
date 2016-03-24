import React from 'react';
import moment from 'moment'
import {Utils} from 'nylas-exports'

function getDateFormat(type) {
  switch (type) {
    case "date": return "YYYY-MM-DD";
    case "time": return "HH:mm:ss";
    default: return null;
  }
}

export default class EventDatetimeInput extends React.Component {
  static displayName = "EventDatetimeInput";

  static propTypes = {
    name: React.PropTypes.string,
    value: React.PropTypes.number.isRequired,
    onChange: React.PropTypes.func.isRequired,
    reversed: React.PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this._datePartStrings = {time: "", date: ""};
  }

  /*
  componentDidMount() {
    const dateInputNode = React.findDOMNode(this.refs.date);
    dateInputNode.addEventListener("mousedown", () => {
      dateInputNode.querySelector("::-webkit-calendar-picker-indicator")
    });
  }
  */

  _onDateChange() {
    const {date, time} = this._datePartStrings;
    const format = `${getDateFormat("date")} ${getDateFormat("time")}`;
    const newDate = moment.tz(`${date} ${time}`, format, Utils.timeZone).unix();
    this.props.onChange(newDate)
  }

  _renderInput(type) {
    const unixDate = this.props.value;
    const str = moment.unix(unixDate).tz(Utils.timeZone).format(getDateFormat(type))
    this._datePartStrings[type] = unixDate != null ? str : null;
    return (
      <input type={type}
        ref={type}
        name={`${this.props.name}-${type}`}
        value={this._datePartStrings[type]}
        onChange={e => {
          this._datePartStrings[type] = e.target.value;
          this._onDateChange()
        }}
      />
    )
  }

  render() {
    if (this.props.reversed) {
      return (
        <span className="datetime-input-container">
          {this._renderInput("time")} on {this._renderInput("date")}
        </span>
      )
    }
    return (
      <span className="datetime-input-container">
        {this._renderInput("date")} at {this._renderInput("time")}
      </span>
    )
  }
}
