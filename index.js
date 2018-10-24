import { createStore, applyMiddleware, combineReducers } from "redux";
import React from "react";
import { connect as originalConnect, Provider } from "react-redux";
import { createSelector, createStructuredSelector } from "reselect";
import PropTypes from "prop-types";

const actions = {};
const actionHandlers = {};
const actionReducers = {};
const commonSelectors = {};
const defaultSelector = x => x;
const types = {
  init: "@@init",
  dispatch: "@@dispatch"
};
let uniqueId = new Date().getTime();

function generateType(obj) {
  if (!obj.type) {
    obj.type = `@@${obj.name}_${uniqueId++}`;
  }
}

function createStateMapper(prop) {
  if (prop[0] === "@") {
    prop = prop.substr(1);
    return (state, props) => props[prop];
  }
  return state => state[prop];
}

function defaultMiddleware(store) {
  return next => action => {
    if (action.handler && action.handler.toString() in actionHandlers) {
      return actionHandlers[action.handler](store, next, action);
    }
    return next(action);
  };
}

export { compose } from "redux";

/**
 * register dynamic action reducer
 * @param reducer
 * @returns {string}
 */
export function actionReducer(reducer) {
  if (typeof reducer !== "function") {
    reducer = combineReducers(reducer);
  }

  generateType(reducer);

  actionReducers[reducer.type] = reducer;

  return reducer.type;
}

/**
 * register dynamic action handler
 * @param handler
 */
export function actionHandler(handler) {
  generateType(handler);

  actionHandlers[handler.type] = handler;

  return handler.type;
}

export function actionCreator(action, options = {}) {
  // single action creator
  if (typeof action === "function") {
    generateType(action);

    let actionMetadata = actions[action.type];
    if (!actionMetadata) {
      actions[action.type] = actionMetadata = {
        handler: action,
        creator(payload, extraProps) {
          return Object.assign(
            { type: action.type, payload },
            options,
            extraProps
          );
        }
      };
    }

    return actionMetadata.creator;
  }
  // support multiple action creators
  const actionCreators = {};
  Object.entries(action).forEach(
    pair => (actionCreators[pair[0]] = actionCreator(pair[1], options))
  );
  return actionCreators;
}

export function connect(mapStateToProps, ...args) {
  if (mapStateToProps) {
    // support named props
    if (typeof mapStateToProps === "string") {
      const props = mapStateToProps.split(/\s+/);
      const structuredSelector = {};
      props.forEach(
        prop =>
          (structuredSelector[prop[0] === "@" ? prop.substr(1) : prop] =
            commonSelectors[prop] ||
            (commonSelectors[prop] = createSelector(
              createStateMapper(prop),
              defaultSelector
            )))
      );
      mapStateToProps = structuredSelector;
    }
    if (typeof mapStateToProps !== "function") {
      return originalConnect(
        createStructuredSelector(mapStateToProps),
        ...args
      );
    }
  }

  return originalConnect(mapStateToProps, ...args);
}

export function create(initialState = {}, ...middlewares) {
  let currentReducer;
  const registeredReducers = {};

  const lazyDispatch = (state, ...actions) => {
    return { type: types.dispatch, state, actions };
  };
  const defaultReducer = (state = initialState, action) => {
    // is custom action
    if (action.type in actions) {
      const actionHandler = actions[action.type].handler;
      const actionResult = actionHandler(state, action.payload, lazyDispatch);

      if (actionResult && actionResult.type === types.dispatch) {
        setTimeout(() => {
          actionResult.actions.forEach(action => store.dispatch(action));
        }, 0);
        state = actionResult.state;
      } else {
        state = actionResult;
      }
    }

    if (action.reducer in actionReducers) {
      const actionReducer = actionReducers[action.reducer];
      state = actionReducer(state, action);
    }

    return currentReducer ? currentReducer(state, action) : state;
  };

  const store = createStore(
    defaultReducer,
    applyMiddleware(...[defaultMiddleware].concat(middlewares))
  );

  const app = Object.assign({}, store, {
    // register reducer
    reducer(reducer) {
      if (typeof reducer !== "function") {
        reducer = combineReducers(reducer);
      }

      generateType(reducer);

      if (reducer.type in registeredReducers) return;

      registeredReducers[reducer.type] = true;

      if (currentReducer) {
        const prevReducer = currentReducer;
        currentReducer = (state, action) =>
          reducer(prevReducer(state, action), action);
      } else {
        currentReducer = reducer;
      }

      // dispatch init method after reducer added
      store.dispatch({ type: types.init });
    },
    Provider(props) {
      return React.createElement(
        Provider,
        Object.assign({ store: app }, props)
      );
    }
  });

  return app;
}

export function withReducer(reducer) {
  if (typeof reducer !== "function") {
    reducer = combineReducers(reducer);
  }

  return function(WrappedComponent) {
    class ReducerInjector extends React.Component {
      render() {
        this.context.store.reducer(reducer);
        return React.createElement(WrappedComponent, this.props);
      }
    }

    ReducerInjector.contextTypes = {
      store: PropTypes.object.isRequired
    };

    ReducerInjector.displayName = `withReducer(${WrappedComponent.displayName ||
      WrappedComponent.name ||
      "Component"})`;
    return ReducerInjector;
  };
}

export default create;
