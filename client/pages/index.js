import { useState } from "react";
import Head from "next/head";

import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useSubscription,
  gql,
  useMutation,
} from "@apollo/client";

// import WebSocket from "ws";
import { WebSocketLink } from "@apollo/client/link/ws";
import { HttpLink } from "@apollo/client/link/http";
import { split } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { Container, Row, Col, FormInput, Button } from "shards-react";

const wsLink = process.browser
  ? new WebSocketLink({
      // if you instantiate in the server, the error will be thrown
      uri: `ws://localhost:4000`,
      options: {
        reconnect: true,
      },
    })
  : null;

const httplink = new HttpLink({
  uri: "http://localhost:4000/",
});

const link = process.browser
  ? split(
      //only create the split in the browser
      // split based on operation type
      ({ query }) => {
        const { kind, operation } = getMainDefinition(query);
        return kind === "OperationDefinition" && operation === "subscription";
      },
      wsLink,
      httplink
    )
  : httplink;

const client = new ApolloClient({
  uri: "http://localhost:4000",
  cache: new InMemoryCache(),
  link,
});

const GET_MESSAGES = gql`
  subscription {
    messages {
      id
      content
      user
    }
  }
`;

const POST_MESSAGE = gql`
  mutation($user: String!, $content: String!) {
    postMessage(user: $user, content: $content)
  }
`;

const Messages = ({ user }) => {
  const { data } = useSubscription(GET_MESSAGES);
  if (!data) {
    return null;
  }
  return (
    <>
      {data.messages.map(({ id, user: messageUser, content }) => (
        <div
          key={id}
          style={{
            display: "flex",
            justifyContent: user === messageUser ? "flex-end" : "flex-start",
            paddingBottom: "1em",
          }}
        >
          {user !== messageUser && (
            <div
              style={{
                height: 50,
                width: 50,
                marginRight: "0.5rem",
                border: "2px solid #e5e6ea",
                borderRadius: 25,
                textAlign: "center",
                fontSize: "18pt",
                paddingTop: 4,
              }}
            >
              {messageUser.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div
            style={{
              background: user === messageUser ? "#58bf56" : "#e5e6ea",
              color: user === messageUser ? "white" : "black",
              padding: "1em",
              borderRadius: "1em",
              maxWidth: "60%",
            }}
          >
            {content}
          </div>
        </div>
      ))}
    </>
  );
};

const Chat = () => {
  const [state, setState] = useState({ user: "Reece", content: "" });
  const [postMessage] = useMutation(POST_MESSAGE);

  const sendMessage = () => {
    if (state.content.length > 0) {
      postMessage({
        variables: state,
      });
    }
    setState({
      ...state,
      content: "",
    });
  };

  return (
    <Container>
      <Messages user={state.user} />
      <Row>
        <Col xs={2} style={{ padding: 0 }}>
          <FormInput
            label="user"
            value={state.user}
            onChange={(e) => setState({ ...state, user: e.target.value })}
          ></FormInput>
        </Col>
        <Col xs={8}>
          <FormInput
            label="Content"
            value={state.content}
            onChange={(e) => setState({ ...state, content: e.target.value })}
            onKeyUp={(e) => {
              if (e.keyCode === 13) {
                sendMessage();
              }
            }}
          ></FormInput>
        </Col>
        <Col xs={2} style={{ padding: 0 }}>
          <Button onClick={() => sendMessage()}>Send</Button>
        </Col>
      </Row>
    </Container>
  );
};

export default function Home() {
  return (
    <div>
      <Head>
        <title>Chat App</title>
      </Head>

      <ApolloProvider client={client}>
        <Chat />
      </ApolloProvider>
    </div>
  );
}
