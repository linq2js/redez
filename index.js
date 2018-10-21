import { createStore, applyMiddleware, combineReducers } from "redux";
import React from "react";
import { connect as originalConnect, Provider } from "react-redux";
import { createSelector, createStructuredSelector } from "reselect";

const actions = {};
const actionHandlers = {};
const commonSelectors = {};
const defaultSelector = x => x;
const types = {
  init: "@@init",
  dispatch: "@@dispatch"
};
let uniqueId = new Date().getTime();

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

/**
 * register dynamic action handler
 * @param handler
 */
export function actionHandler(handler) {
  if (!handler.type) {
    handler.type = `@@${handler.name}_${uniqueId++}`;
  }

  actionHandlers[handler.type] = handler;

  return handler.type;
}

export function actionCreator(action) {
  // single action creator
  if (typeof action === "function") {
    if (!action.type) {
      action.type = `@@${action.name}_${uniqueId++}`;
    }
    let actionMetadata = actions[action.type];
    if (!actionMetadata) {
      actions[action.type] = actionMetadata = {
        handler: action,
        creator(payload, extraProps) {
          return Object.assign({ type: action.type, payload }, extraProps);
        }
      };
    }

    return actionMetadata.creator;
  }
  // support multiple action creators
  const actionCreators = {};
  Object.entries(action).forEach(
    pair => (actionCreators[pair[0]] = actionCreator(pair[1]))
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
        return actionResult.state;
      }
      return actionResult;
    }
    return currentReducer ? currentReducer(state, action) : state;
  };

  const store = createStore(
    defaultReducer,
    applyMiddleware(...[defaultMiddleware].concat(middlewares))
  );

  return Object.assign({}, store, {
    // register reducer
    reducer(reducer) {
      if (typeof reducer !== "function") {
        reducer = combineReducers(reducer);
      }
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
      return React.createElement(Provider, Object.assign({ store }, props));
    }
  });
}

export default create;
