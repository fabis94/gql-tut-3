import { GraphQLClient } from "graphql-request";
import { useState, useEffect } from "react";

export const BASE_URL = "http://localhost:4000/graphql";

export const useClient = () => {
  const [idToken, setIdToken] = useState("");
  useEffect(() => {
    const idToken = window.gapi.auth2
      .getAuthInstance()
      .currentUser.get()
      .getAuthResponse().id_token;

    setIdToken(idToken);
  }, []);

  return new GraphQLClient(BASE_URL, {
    headers: { authorization: idToken }
  });
};
