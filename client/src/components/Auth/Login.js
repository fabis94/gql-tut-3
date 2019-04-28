import React, { useContext } from "react";
import { GraphQLClient } from "graphql-request";
import { GoogleLogin } from "react-google-login";
import { withStyles } from "@material-ui/core/styles";
import Context from "../../context";
import { Typography } from "@material-ui/core";
import { ME_QUERY } from "../../graphql/queries";
import { BASE_URL } from "../../client";

const Login = ({ classes }) => {
  const { dispatch } = useContext(Context);

  const onSuccess = async user => {
    try {
      const idToken = user.getAuthResponse().id_token;
      const client = new GraphQLClient(BASE_URL, {
        headers: {
          authorization: idToken
        }
      });

      const data = await client.request(ME_QUERY);
      dispatch({ type: "LOGIN_USER", payload: data.me });
      dispatch({ type: "IS_LOGGED_IN", payload: user.isSignedIn() });
    } catch (err) {
      onFailure(err);
    }
  };

  const onFailure = err => {
    console.error("Error logging in", err);
  };

  return (
    <div className={classes.root}>
      <Typography
        component="h1"
        variant="h3"
        gutterBottom
        noWrap
        style={{ color: "rgb(66, 133, 244)" }}
      >
        Welcome
      </Typography>
      <GoogleLogin
        clientId="188712007055-moh9q60gpqvf5fldnk0tklhbgqa7r8h7.apps.googleusercontent.com"
        onSuccess={onSuccess}
        onFailure={onFailure}
        isSignedIn={true}
        theme="dark"
        buttonText="Login"
      />
    </div>
  );
};

const styles = {
  root: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    alignItems: "center"
  }
};

export default withStyles(styles)(Login);
