import { createStore, applyMiddleware, combineReducers } from "redux";
import React from "react";
import { connect as reduxConnect, Provider } from "react-redux";
import { createSelector, createStructuredSelector } from "reselect";

const actions = {};
const commonSelectors = {};
const defaultSelector = x => x;
const types = {
  dispatch: "@@dispatch"
};
let actionId = new Date().getTime();

function createStateMapper(prop) {
  if (prop[0] === "@") {
    prop = prop.substr(1);
    return (state, props) => props[prop];
  }
  return state => state[prop];
}

export function actionCreator(action) {
  if (typeof action === "function") {
    if (!action.__actionId) {
      action.__actionId = `@@${action.name}_${actionId++}`;
    }
    let actionMetadata = actions[action.__actionId];
    if (!actionMetadata) {
      actions[action.__actionId] = actionMetadata = {
        handler: action,
        creator(payload) {
          return { type: action.__actionId, payload };
        }
      };
    }

    return actionMetadata.creator;
  }
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
      return reduxConnect(createStructuredSelector(mapStateToProps), ...args);
    }
  }

  return reduxConnect(mapStateToProps, ...args);
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

  const store = middlewares.length
    ? // create store with middlewares
      createStore(defaultReducer, applyMiddleware(...middlewares))
    : createStore(defaultReducer);

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
    },
    Provider(props) {
      return React.createElement(Provider, Object.assign({ store }, props));
    }
  });
}

export default create;
