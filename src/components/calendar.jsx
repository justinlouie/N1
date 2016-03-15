/** @babel */

import React from 'react'

class MonthView extends React.Component {
  static displayName = "MonthView";

  static propTypes = {
    changeView: React.PropTypes.func
  }

  constructor(props) {
    super(props);
  }

  render() {
    return <button onClick={this._onClick}>Change to week</button>
  }

  _onClick = () => {
    this.props.changeView("WeekView");
  }
}

class WeekView extends React.Component {
  static displayName = "WeekView";

  static propTypes = {
    changeView: React.PropTypes.func
  }

  constructor(props) {
    super(props);
  }

  render() {
    return <button onClick={this._onClick}>Change to month</button>
  }

  _onClick = () => {
    this.props.changeView("MonthView");
  }
}

export default class Calendar extends React.Component {
  static displayName = "Calendar";

  constructor(props) {
    super(props);
    this.state = {
      viewType: WeekView
    };
  }

  render() {
    return <this.state.viewType changeView={this._changeViewType} />
  }

  _changeViewType = (viewType) => {
    var lookup = {"WeekView": WeekView,
                  "MonthView": MonthView};
    this.setState({viewType: lookup[viewType]});
  }
}

