import React from 'react'
import {Utils} from 'nylas-exports'

export default class FooterControls extends React.Component {
  static displayName = "FooterControls";

  static propTypes = {
    footerComponents: React.PropTypes.node,
  }

  static defaultProps = {
    footerComponents: false,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (!Utils.isEqualReact(nextProps, this.props) ||
            !Utils.isEqualReact(nextState, this.state));
  }

  render() {
    if (!this.props.footerComponents) {
      return false
    }
    return (
      <div className="footer-controls">
        {this.props.footerComponents}
      </div>
    )
  }
}
