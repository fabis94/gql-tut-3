import React, { useState, useEffect, useContext } from "react";
import { withStyles } from "@material-ui/core/styles";
import ReactMapGL, { NavigationControl, Marker, Popup } from "react-map-gl";
import PinIcon from "./PinIcon";
import Context from "../context";
import { stat } from "fs";
import differenceInMinutes from "date-fns/difference_in_minutes";

import { useClient } from "../client";
import { GET_PINS_QUERY } from "../graphql/queries";
import { DELETE_PIN_MUTATION } from "../graphql/mutations";

import Blog from "./Blog";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";

const INIT_VIEWPORT = {
  latitude: 50,
  longitude: 20,
  zoom: 14
};

const Map = ({ classes }) => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);
  const [viewport, setViewport] = useState(INIT_VIEWPORT);
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    getUserPosition();
  }, []);

  useEffect(() => {
    getPins();
  }, []);

  const [popup, setPopup] = useState(null);

  const getPins = async () => {
    const { getPins } = await client.request(GET_PINS_QUERY);
    dispatch({ type: "GET_PINS", payload: getPins });
  };

  const getUserPosition = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        setViewport({ ...viewport, latitude, longitude });
        setUserPosition({ latitude, longitude });
      });
    }
  };

  const handleMapClick = ({ lngLat, leftButton }) => {
    if (!leftButton) return;
    if (!state.draft) {
      dispatch({ type: "CREATE_DRAFT" });
    }

    const [longitude, latitude] = lngLat;
    dispatch({
      type: "UPDATE_DRAFT_LOCATION",
      payload: { longitude, latitude }
    });
  };

  const highlightNewPin = pin => {
    const diff = differenceInMinutes(
      Date.now(),
      Number.parseInt(pin.createdAt)
    );
    const isNewPin = diff <= 30;
    return isNewPin ? "limegreen" : "darkblue";
  };

  const handleSelectPin = pin => {
    setPopup(pin);
    dispatch({ type: "SET_PIN", payload: pin });
  };

  const handleDeletePin = async pin => {
    const variables = { pinId: pin._id };
    const { deletePin } = await client.request(DELETE_PIN_MUTATION, variables);
    dispatch({ type: "DELETE_PIN", payload: deletePin });

    setPopup(null);
  };

  const isPopupAuthor = () => state.currentUser._id === popup.author._id;

  return (
    <div className={classes.root}>
      <ReactMapGL
        mapboxApiAccessToken="pk.eyJ1IjoiZmFiaXM5NCIsImEiOiJjanYwc2szNjYwbGZvNDVudWduN2hvZjQ1In0.sV1kfcbIdku23TivfDy_kg"
        width="100vw"
        height="calc(100vh - 64px)"
        mapStyle="mapbox://styles/mapbox/streets-v9"
        onViewportChange={newViewport => setViewport(newViewport)}
        {...viewport}
        onClick={handleMapClick}
      >
        <div className={classes.navigationControl}>
          <NavigationControl
            onViewportChange={newViewport => setViewport(newViewport)}
          />

          {userPosition && (
            <Marker
              latitude={userPosition.latitude}
              longitude={userPosition.longitude}
              offsetLeft={-19}
              offsetTop={-37}
            >
              <PinIcon size={40} color="red" />
            </Marker>
          )}

          {state.draft && (
            <Marker
              latitude={state.draft.latitude}
              longitude={state.draft.longitude}
              offsetLeft={-19}
              offsetTop={-37}
            >
              <PinIcon size={40} color="hotpink" />
            </Marker>
          )}

          {state.pins.map(pin => (
            <Marker
              latitude={pin.latitude}
              longitude={pin.longitude}
              offsetLeft={-19}
              offsetTop={-37}
              key={pin._id}
            >
              <PinIcon
                size={40}
                color={highlightNewPin(pin)}
                onClick={() => handleSelectPin(pin)}
              />
            </Marker>
          ))}

          {popup && (
            <Popup
              anchor="top"
              latitude={popup.latitude}
              longitude={popup.longitude}
              closeOnClick={false}
              onClose={() => setPopup(null)}
            >
              <img
                className={classes.popupImage}
                src={popup.image}
                alt={popup.title}
              />
              <div className={classes.popupTab}>
                <Typography>
                  {popup.latitude.toFixed(6)}, {popup.longitude.toFixed(6)}
                </Typography>
                {isPopupAuthor() && (
                  <Button onClick={() => handleDeletePin(popup)}>
                    <DeleteIcon className={classes.deleteIcon} />
                  </Button>
                )}
              </div>
            </Popup>
          )}
        </div>
      </ReactMapGL>
      <Blog />
    </div>
  );
};

const styles = {
  root: {
    display: "flex"
  },
  rootMobile: {
    display: "flex",
    flexDirection: "column-reverse"
  },
  navigationControl: {
    position: "absolute",
    top: 0,
    left: 0,
    margin: "1em"
  },
  deleteIcon: {
    color: "red"
  },
  popupImage: {
    padding: "0.4em",
    height: 200,
    width: 200,
    objectFit: "cover"
  },
  popupTab: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column"
  }
};

export default withStyles(styles)(Map);
