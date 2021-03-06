import React from "react";
import pickRandom from "pick-random";
import { parseString } from "react-native-xml2js";
import {
  Animated,
  AsyncStorage,
  FlatList,
  Image,
  Linking,
  PanResponder,
  StyleSheet,
  StatusBar,
} from "react-native";
import clamp from "clamp";
import getTheme from "./native-base-theme/components";
import {
  Root,
  Body,
  Button,
  Container,
  Content,
  Card,
  CardItem,
  DeckSwiper,
  Header,
  Icon,
  Left,
  Right,
  Spinner,
  StyleProvider,
  Text,
  Title,
  View,
} from "native-base";
import { Constants } from "expo";

export default class Setup extends React.Component {
  constructor() {
    super();
    this.state = {
      isReady: false,
    };
  }

  componentWillMount() {
    this.loadFonts();
  }

  async loadFonts() {
    await Expo.Font.loadAsync({
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      Ionicons: require("@expo/vector-icons/fonts/Ionicons.ttf"),
    });
    this.setState({ isReady: true });
  }

  render() {
    if (!this.state.isReady) {
      return <Expo.AppLoading />;
    }
    return (
      <StyleProvider style={getTheme()}>
        <App />
      </StyleProvider>
    );
  }
}

const NUM_CARDS_PER_GAME = 10;

// The maximum amount of time we wait for aviationweather.gov to
// return with data. If this timeout is execeeded, then the offline
// data are used.
const FETCH_TIMEOUT_MS = 6000;

const AIRPORT_IDS = require("./data/airport-ids.json");
const OFFLINE_METARS = require("./data/offline-metars.json");
const METAR_ENDPOINT =
  "https://www.aviationweather.gov/adds/dataserver_current/httpparam?" +
  "dataSource=metars&requestType=retrieve&format=xml&" +
  "hoursBeforeNow=24&mostRecentForEachStation=true&stationString=";
const FLIGHT_CATEGORIES_EXPLANATION =
  "https://www.aviationweather.gov/taf/help?page=plot";
const GAME_RESULTS_KEY_PREFIX = "results:";

const PICS = [
  require("./images/0001.jpg"),
  require("./images/0002.jpg"),
  require("./images/0003.jpg"),
  require("./images/0004.jpg"),
  require("./images/0005.jpg"),
  require("./images/0006.jpg"),
  require("./images/0007.jpg"),
  require("./images/0008.jpg"),
  require("./images/0009.jpg"),
  require("./images/0010.jpg"),
  require("./images/0011.jpg"),
  require("./images/0012.jpg"),
  require("./images/0013.jpg"),
  require("./images/0014.jpg"),
  require("./images/0015.jpg"),
  require("./images/0016.jpg"),
  require("./images/0017.jpg"),
  require("./images/0018.jpg"),
  require("./images/0019.jpg"),
  require("./images/0020.jpg"),
  require("./images/0021.jpg"),
  require("./images/0022.jpg"),
  require("./images/0023.jpg"),
  require("./images/0024.jpg"),
  require("./images/0025.jpg"),
  require("./images/0026.jpg"),
  require("./images/0027.jpg"),
  require("./images/0028.jpg"),
  require("./images/0029.jpg"),
  require("./images/0030.jpg"),
  require("./images/0031.jpg"),
  require("./images/0032.jpg"),
  require("./images/0033.jpg"),
  require("./images/0034.jpg"),
  require("./images/0035.jpg"),
  require("./images/0036.jpg"),
  require("./images/0037.jpg"),
  require("./images/0038.jpg"),
  require("./images/0039.jpg"),
  require("./images/0040.jpg"),
  require("./images/0041.jpg"),
  require("./images/0042.jpg"),
];

class Swiper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentIdx: 0,
      pan: new Animated.ValueXY(),
      fadeIn: new Animated.Value(0),
      scale: new Animated.Value(0.8),
    };

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => true,
      onStartShouldSetPanResponderCapture: (event, gestureState) => true,
      onMoveShouldSetPanResponder: (event, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (event, gestureState) => true,

      onPanResponderGrant: (event, gestureState) => {
        this.state.pan.setOffset({
          x: this.state.pan.x._value,
          y: this.state.pan.y._value,
        });
        this.state.pan.setValue({ x: 0, y: 0 });

        // The gesture has started. Show visual feedback so the user knows
        // what is happening!

        // gestureState.d{x,y} will be set to zero now
      },
      onPanResponderMove: (event, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}

        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
        Animated.spring(this.state.scale, {
          toValue: Math.min(0.8 + Math.abs(gestureState.dx) / 1000, 1),
          friction: 7,
        }).start();
        Animated.event([null, { dx: this.state.pan.x, dy: this.state.pan.y }])(
          event,
          gestureState
        );
      },
      onPanResponderTerminationRequest: (event, gestureState) => true,
      onPanResponderRelease: (event, gestureState) => {
        vx =
          (this.state.pan.x._value < 0 ? -1 : 1) *
          clamp(Math.abs(gestureState.vx), 5, 10);

        if (Math.abs(this.state.pan.x._value) > 150) {
          this.swipe(vx, gestureState.vy);
        } else {
          Animated.spring(this.state.pan, {
            toValue: { x: 0, y: 0 },
            friction: 4,
          }).start();
        }
      },
      onPanResponderTerminate: (event, gestureState) => {
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      onShouldBlockNativeResponder: (event, gestureState) => {
        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return true;
      },
    });
  }

  swipe(vx, vy) {
    Animated.decay(this.state.pan, {
      velocity: { x: vx, y: vy },
      deceleration: 0.98,
    }).start(this.advance.bind(this, vx));
  }

  swipeLeft() {
    this.swipe(-8, 0);
    Animated.spring(this.state.scale, {
      toValue: 1,
      friction: 7,
    }).start();
  }

  swipeRight() {
    this.swipe(8, 0);
    Animated.spring(this.state.scale, {
      toValue: 1,
      friction: 7,
    }).start();
  }

  resetAnimationState() {
    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.fadeIn.setValue(0.8);
    this.state.scale.setValue(0.8);
  }

  advance(vx) {
    this.resetAnimationState();
    this.setState(prevState => {
      this.callListeners(vx);
      let newIdx = this.state.currentIdx + 1;
      if (newIdx == this.props.cards.length) {
        this.props.onDone();
      }
      return {
        currentIdx: newIdx,
      };
    });
  }

  reset() {
    this.resetAnimationState();
    this.setState(prevState => ({
      currentIdx: 0,
    }));
  }

  callListeners(velocity) {
    if (velocity < 0) {
      func = this.props.onSwipeLeft;
    } else {
      func = this.props.onSwipeRight;
    }
    if (func) {
      func(this.props.cards[this.state.currentIdx]);
    }
  }

  render() {
    let bottomStyle = [
      {
        elevation: 2,
        transform: [
          { translateX: this.state.pan.x },
          { translateY: this.state.pan.y },
        ],
      },
    ];

    // Use an absolute position on the the card that is covered by the
    // top card, so it stays under the top card. However, do not use
    // an absolute position when "the bottom card" is the last card,
    // otherwise other UI elements will take the place of the pile of
    // cards.
    if (this.state.currentIdx < this.props.cards.length - 1) {
      bottomStyle.push({
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
      });
    }

    return (
      <View>
        {this.state.currentIdx < this.props.cards.length - 1 && (
          <Animated.View
            style={{ elevation: 2, transform: [{ scale: this.state.scale }] }}
          >
            {this.props.renderItem(this.props.cards[this.state.currentIdx + 1])}
          </Animated.View>
        )}

        {this.state.currentIdx < this.props.cards.length && (
          <Animated.View style={bottomStyle} {...this.panResponder.panHandlers}>
            {this.props.renderItem(this.props.cards[this.state.currentIdx])}
          </Animated.View>
        )}
      </View>
    );
  }
}

const GameState = Object.freeze({
  fetching: 0,
  ready: 1,
  playing: 2,
  done: 3,
});

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gameState: GameState.fetching,
    };
    this.getCards();
  }

  addImagesToCards(cards) {
    images = pickRandom(PICS, { count: cards.length });
    for (i = 0; i < cards.length; i++) {
      cards[i].image = images[i];
    }
  }

  processMetars(data) {
    let cards = [];

    // TODO(aryann): Instead of picking NUM_CARDS_PER_GAME items here,
    // start processing all items and draw the first
    // NUM_CARDS_PER_GAME that have all of the data we need. That way,
    // if the online data is corrupt, then the caller can fall back to
    // the offline data that we know are good.
    let metars = pickRandom(data, {
      count: Math.min(NUM_CARDS_PER_GAME, data.length),
    });

    for (let i = 0; i < metars.length; i++) {
      let metar = metars[i];
      let flight_category;
      if (metar.flight_category.endsWith("VFR")) {
        flight_category = "VFR";
      } else {
        flight_category = "IFR";
      }

      cards.push({
        station: metar.station_id,
        metar: metar.raw_text,
        flight_category: flight_category,
        answer: null,
        index: i,
      });
    }
    this.addImagesToCards(cards);
    return cards;
  }

  setCards(metars) {
    this.cards = this.processMetars(metars);
    this.setState(prevState => {
      this.readyAtMillis = Date.now();
      return { gameState: GameState.ready };
    });
  }

  getCards() {
    this.fetchStartMillis = Date.now();
    this.cards = [];

    // TODO(aryann): Figure out how to add a timeout to the fetch()
    // call, so we can fail faster if aviationweather.gov is being
    // slow.

    // The aviationweather.gov endpoint does not always return as many
    // METARs as we ask for, so here, we ask for more than we need,
    // and perform another pickRandom() call with the real data to
    // pick exactly the number of METARs as we want.
    let airports = pickRandom(AIRPORT_IDS, { count: NUM_CARDS_PER_GAME * 2 });

    let airportsQueryParam = airports.join(",");
    let endpoint = METAR_ENDPOINT + airportsQueryParam;
    console.log("Sending request to: ", endpoint);

    let timer = setTimeout(() => {
      console.log("Using offline METARs because the HTTP request timed out.");
      this.setCards(OFFLINE_METARS);
    }, FETCH_TIMEOUT_MS);

    fetch(endpoint)
      .then(response => response.text())
      .then(response => {
        // If the timeout hasn't fired yet, then clear it and consume
        // these results. Otherwise, exit because we've exhausted the
        // timeout and already decided to use the offline data.
        if (this.cards.length == 0) {
          clearTimeout(timer);
        } else {
          return;
        }

        parseString(response, { explicitArray: false }, (error, result) => {
          let metars;
          if (error || result.response.data.METAR.length < NUM_CARDS_PER_GAME) {
            metars = OFFLINE_METARS;
            console.log("Using offline METARs due to error:", error);
          } else {
            console.log("Using METARs from aviationweather.gov.");
            metars = result.response.data.METAR;
          }

          this.setCards(metars);
        });
      })
      .catch(error => {
        console.log("Using offline METARs due to error:", error);
        this.setCards(OFFLINE_METARS);
      });
  }

  numCorrect() {
    let num = 0;
    for (i = 0; i < this.cards.length; i++) {
      if (this.cards[i].flight_category === this.cards[i].answer) {
        num++;
      }
    }
    return num;
  }

  render() {
    let renderMetar = item => (
      <View>
        <CardItem bordered>
          <Left>
            <Body>
              <Text>{item.station}</Text>
            </Body>
          </Left>
          <Right>
            <Text>
              {item.index + 1}/{this.cards.length}
            </Text>
          </Right>
        </CardItem>
        <CardItem>
          <Image
            style={{ width: null, height: 200, flex: 1, resizeMode: "cover" }}
            source={item.image}
            resizeMethod="resize"
          />
        </CardItem>
        <CardItem>
          <Left>
            <Body>
              <Text>{item.metar}</Text>
            </Body>
          </Left>
        </CardItem>
      </View>
    );

    let renderQuizCard = item => (
      <Card style={{ elevation: 2, height: 380 }}>{renderMetar(item)}</Card>
    );

    let renderAnswerCard = ({ item }) => {
      let icon;
      if (item.flight_category === item.answer) {
        icon = (
          <Icon
            name="md-checkmark-circle"
            style={{ color: "green", fontSize: 16 }}
          />
        );
      } else {
        icon = (
          <Icon name="md-close-circle" style={{ color: "red", fontSize: 16 }} />
        );
      }

      return (
        <Card style={{ elevation: 2 }}>
          {renderMetar(item)}
          <CardItem bordered>
            <Left>
              <Body>
                <Text>Flight category: {item.flight_category}</Text>
                <Text>
                  Your answer: {item.answer} {icon}
                </Text>
              </Body>
            </Left>
          </CardItem>
        </Card>
      );
    };

    let start = () => {
      this.setState(prevState => {
        return { gameState: GameState.playing };
      });
    };

    let playAgain = () => {
      this.setState(prevState => ({
        gameState: GameState.fetching,
      }));
      this.getCards();
    };

    let getHelp = () => {
      Linking.canOpenURL(FLIGHT_CATEGORIES_EXPLANATION).then(supported => {
        if (supported) {
          Linking.openURL(FLIGHT_CATEGORIES_EXPLANATION);
        } else {
          console.log("Could not open URL: " + FLIGHT_CATEGORIES_EXPLANATION);
        }
      });
    };

    let recordAnswer = (item, answer) => {
      item.answer = answer;
      item.answered_at_millis = Date.now();
    };

    let onSwipeLeft = item => {
      recordAnswer(item, "IFR");
    };

    let onSwipeRight = item => {
      recordAnswer(item, "VFR");
    };

    let onDone = () => {
      let resultsKey = GAME_RESULTS_KEY_PREFIX + this.readyAtMillis;
      AsyncStorage.setItem(
        resultsKey,
        JSON.stringify({
          fetchStartMillis: this.fetchStartMillis,
          readyAtMillis: this.readyAtMillis,
          gameResults: this.cards,
        }),
        error => {
          if (error) {
            console.log("Failed to persist data.", error);
          }
        }
      );
      this.setState(prevState => ({
        gameState: GameState.done,
      }));
    };

    let renderResultsHeader = () => {
      return renderPlayAgainBox(() => {
        let numCorrect = this.numCorrect();
        if (numCorrect === 0) {
          return (
            <Text>
              You didn't get any of the {this.cards.length} flight categories
              right. Be safe out there!
            </Text>
          );
        } else {
          return (
            <Text>
              You got {numCorrect} out of {this.cards.length} right!
            </Text>
          );
        }
      });
    };

    let renderResultsFooter = () => {
      return renderPlayAgainBox(() => <Text>That's all for now!</Text>);
    };

    let renderPlayAgainBox = textFunction => {
      return (
        <Card style={{ elevation: 2 }}>
          <CardItem>
            <Left>
              <Body>{textFunction()}</Body>
            </Left>

            <Right>
              <Button
                rounded
                primary
                style={{ marginRight: 5 }}
                onPress={playAgain}
              >
                <Text>play again</Text>
              </Button>
            </Right>
          </CardItem>
        </Card>
      );
    };

    return (
      <View style={{ flex: 1, paddingLeft: 10, paddingRight: 10 }}>
        {(this.state.gameState === GameState.fetching ||
          this.state.gameState === GameState.ready) && (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Card style={{ elevation: 2, height: 280 }}>
              <CardItem>
                <Left>
                  <Body>
                    <Text style={{ marginBottom: 16 }}>
                      We'll show you METARs, you decide the flight category.
                      Swipe right for Visual Flight Rules, swipe left for
                      Instrument Flight Rules!
                    </Text>

                    <Text style={{ marginBottom: 16 }}>
                      Check out{" "}
                      <Text
                        style={{
                          color: "blue",
                          fontWeight: "bold",
                          textDecorationLine: "underline",
                        }}
                        onPress={getHelp}
                      >
                        aviationweather.gov
                      </Text>{" "}
                      for a refresher on flight categories.
                    </Text>

                    <Text style={{ marginBottom: 16 }}>
                      Information displayed is not intended for flight planning.
                    </Text>

                    <View style={{ height: 65 }}>
                      <View
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          justifyContent: "center",
                        }}
                      >
                        {this.state.gameState === GameState.fetching && (
                          <Spinner />
                        )}

                        {this.state.gameState === GameState.ready && (
                          <Button onPress={start} success rounded>
                            <Text>Let's get started!</Text>
                          </Button>
                        )}
                      </View>
                    </View>
                  </Body>
                </Left>
              </CardItem>
            </Card>
          </View>
        )}

        {this.state.gameState === GameState.playing && (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Swiper
              ref={c => (this.swiper = c)}
              cards={this.cards}
              renderItem={renderQuizCard}
              onDone={onDone}
              onSwipeRight={onSwipeRight}
              onSwipeLeft={onSwipeLeft}
            />

            <View style={{ height: 65 }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
                padder
              >
                <Button onPress={() => this.swiper.swipeLeft()} danger rounded>
                  <Icon name="arrow-back" />
                  <Text>IFR</Text>
                </Button>
                <Button
                  onPress={() => this.swiper.swipeRight()}
                  success
                  rounded
                >
                  <Text>VFR</Text>
                  <Icon name="arrow-forward" />
                </Button>
              </View>
            </View>
          </View>
        )}

        {this.state.gameState === GameState.done && (
          <FlatList
            data={this.cards}
            renderItem={renderAnswerCard}
            ListHeaderComponent={renderResultsHeader}
            ListFooterComponent={renderResultsFooter}
            keyExtractor={(item, index) => item.station}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  }
}

class App extends React.Component {
  render() {
    return (
      <Container>
        <View
          style={{ backgroundColor: "blue", height: Constants.statusBarHeight }}
        />
        <Header>
          <Left />
          <Body>
            <Title>VFR or Not</Title>
          </Body>
          <Right />
        </Header>
        <Game />
      </Container>
    );
  }
}
