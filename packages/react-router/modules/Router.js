import React from "react";
import PropTypes from "prop-types";
import warning from "tiny-warning";
import { parse } from "query-string";

import HistoryContext from "./HistoryContext.js";
import RouterContext from "./RouterContext.js";

/**
 * The public API for putting history on context.
 */
class Router extends React.Component {
  static computeRootMatch(pathname) {
    return { path: "/", url: "/", params: {}, isExact: pathname === "/" };
  }

  constructor(props) {
    super(props);

    let location = props.history.location;
    location.query = parse(location.search);
    this.state = {
      location,
      horizontalRoute: false,
      horizontalRouteId: undefined,
      action: undefined
    };

    // This is a bit of a hack. We have to start listening for location
    // changes here in the constructor in case there are any <Redirect>s
    // on the initial render. If there are, they will replace/push when
    // they mount and since cDM fires in children before parents, we may
    // get a new location before the <Router> is mounted.
    this._isMounted = false;
    this._pendingLocation = null;

    if (!props.staticContext) {
      this.unlisten = props.history.listen(location => {
        this._pendingLocation = location;
      });
    }
  }

  componentDidMount() {
    this._isMounted = true;

    if (this.unlisten) {
      // Any pre-mount location changes have been captured at
      // this point, so unregister the listener.
      this.unlisten();
    }
    if (!this.props.staticContext) {
      this.unlisten = this.props.history.listen(location => {
        location.query = parse(location.search);
        if (this._isMounted) {
          if (location.state && location.state.horizontalRoute) {
            this.setState({
              location,
              horizontalRoute: true,
              horizontalRouteId: location.state.horizontalRouteId,
              action: location.state.action
            });
          } else {
            this.setState({
              location,
              horizontalRoute: false,
              horizontalRouteId: undefined,
              action: undefined
            });
          }
        }
      });
    }
    if (this._pendingLocation) {
      const location = this._pendingLocation;
      if (location.state && location.state.horizontalRoute) {
        this.setState({
          location,
          horizontalRoute: true,
          horizontalRouteId: location.state.horizontalRouteId,
          action: location.state.action
        });
      } else {
        this.setState({
          location,
          horizontalRoute: false,
          horizontalRouteId: undefined,
          action: undefined
        });
      }
    }
  }

  componentWillUnmount() {
    if (this.unlisten) {
      this.unlisten();
      this._isMounted = false;
      this._pendingLocation = null;
    }
  }

  render() {
    const props = {
      history: this.props.history,
      location: this.state.location,
      match: Router.computeRootMatch(this.state.location.pathname),
      staticContext: this.props.staticContext
    };
    if (this.state.horizontalRoute) {
      props.horizontalRouter = {
        horizontalRouteId: this.state.horizontalRouteId,
        action: this.state.action
      };
    }
    return (
      <RouterContext.Provider value={props}>
        <HistoryContext.Provider
          children={this.props.children || null}
          value={this.props.history}
        />
      </RouterContext.Provider>
    );
  }
}

if (__DEV__) {
  Router.propTypes = {
    children: PropTypes.node,
    history: PropTypes.object.isRequired,
    staticContext: PropTypes.object
  };

  Router.prototype.componentDidUpdate = function(prevProps) {
    warning(
      prevProps.history === this.props.history,
      "You cannot change <Router history>"
    );
  };
}

export default Router;
