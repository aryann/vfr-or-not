import React from 'react';
import pickRandom from 'pick-random';
import { parseString } from 'react-native-xml2js';
import { Animated, Image, PanResponder, StyleSheet } from 'react-native';
import clamp from 'clamp';
import getTheme from './native-base-theme/components';
import {
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
} from 'native-base';
import SwipeCards from 'react-native-swipe-cards';

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
      Roboto: require('native-base/Fonts/Roboto.ttf'),
      Roboto_medium: require('native-base/Fonts/Roboto_medium.ttf'),
      Ionicons: require('@expo/vector-icons/fonts/Ionicons.ttf'),
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
const AIRPORT_IDS = require('./data/airport-ids.json');
const METAR_ENDPOINT =
  'https://www.aviationweather.gov/adds/dataserver_current/httpparam?' +
  'dataSource=metars&requestType=retrieve&format=xml&' +
  'hoursBeforeNow=24&mostRecentForEachStation=true&stationString=';

const PICS = [
  require('./images/pexels-photo-1046493.jpeg'),
  require('./images/pexels-photo-104757.jpeg'),
  require('./images/pexels-photo-1098745.jpeg'),
  require('./images/pexels-photo-113585.jpeg'),
  require('./images/pexels-photo-126626.jpeg'),
  require('./images/pexels-photo-1272392.jpeg'),
  require('./images/pexels-photo-1309644.jpeg'),
  require('./images/pexels-photo-164589.jpeg'),
  require('./images/pexels-photo-358220.jpeg'),
  require('./images/pexels-photo-459402.jpeg'),
  require('./images/pexels-photo-615060.jpeg'),
  require('./images/pexels-photo-638698.jpeg'),
  require('./images/pexels-photo-723240.jpeg'),
  require('./images/pexels-photo-726296.jpeg'),
  require('./images/pexels-photo-728824.jpeg'),
  require('./images/pexels-photo-730778.jpeg'),
  require('./images/pexels-photo-946841.jpeg'),
];

const styles = StyleSheet.create({
  card: {
    elevation: 5,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});

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
        //console.log(event);
      },
      onPanResponderMove: (event, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}

        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
        Animated.spring(this.state.scale, {
          toValue: Math.min(0.8 + Math.abs(gestureState.dx) / 1000, 1),
          friction: 7,
        }).start();
        Animated.event([null, { dx: this.state.pan.x }])(event, gestureState);
      },
      onPanResponderTerminationRequest: (event, gestureState) => true,
      onPanResponderRelease: (event, gestureState) => {
        velocity =
          (gestureState.vx < 0 ? -1 : 1) *
          clamp(Math.abs(gestureState.vx), 5, 10);

        if (Math.abs(this.state.pan.x._value) > 100) {
          this.callListeners(velocity);
          Animated.decay(this.state.pan, {
            velocity: { x: velocity, y: gestureState.vy },
            deceleration: 0.98,
          }).start(this.advance.bind(this));
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

  resetAnimationState() {
    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.fadeIn.setValue(0.8);
    this.state.scale.setValue(0.8);
  }

  advance() {
    this.resetAnimationState();
    this.setState(
      prevState => ({
        currentIdx: prevState.currentIdx + 1,
      }),
      () => {
        if (this.state.currentIdx == this.props.cards.length) {
          this.props.onDone();
        }
      }
    );
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
    return (
      <View>
        {this.state.currentIdx < this.props.cards.length - 1 && (
          <Animated.View
            style={[styles.card, { transform: [{ scale: this.state.scale }] }]}
          >
            {this.props.renderItem(this.props.cards[this.state.currentIdx + 1])}
          </Animated.View>
        )}

        {this.state.currentIdx < this.props.cards.length && (
          <Animated.View
            style={[
              styles.card,
              {
                transform: [
                  { translateX: this.state.pan.x },
                  { translateY: this.state.pan.y },
                ],
              },
            ]}
            {...this.panResponder.panHandlers}
          >
            {this.props.renderItem(this.props.cards[this.state.currentIdx])}
          </Animated.View>
        )}
      </View>
    );
  }
}

const GameState = Object.freeze({ fetching: 0, playing: 1, done: 2 });

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gameState: GameState.fetching,
    };
    this.answers = [];
    this.getCards();
  }

  addImagesToCards(cards) {
    images = pickRandom(PICS, { count: cards.length });
    for (i = 0; i < cards.length; i++) {
      cards[i].image = images[i];
    }
  }

  processMetarsFromApi(response) {
    cards = [];
    response.response.data.METAR.forEach(metar => {
      cards.push({
        station: metar.station_id,
        metar: metar.raw_text,
        flight_category: metar.flight_category,
      });
    });
    this.addImagesToCards(cards);
    return cards;
  }

  getCards() {
    airports = pickRandom(AIRPORT_IDS, { count: NUM_CARDS_PER_GAME });
    airportsQueryParam = airports.join(',');
    endpoint = METAR_ENDPOINT + airportsQueryParam;
    console.log('Sending request to: ', endpoint);

    fetch(endpoint)
      .then(response => response.text())
      .then(response => {
        parseString(response, { explicitArray: false }, (error, result) => {
          console.log('Response:', result);
          this.cards = this.processMetarsFromApi(result);
          if (this.cards.length > 0) {
            this.setState(prevState => {
              return { gameState: GameState.playing };
            });
          }
        });
      })
      .catch(error => {
        console.log('error', error);

        // TODO(aryann): Fall back to a fixed set of cards if we can't get any data.
      });
  }

  render() {
    let renderItem = item => (
      <Card>
        <CardItem bordered>
          <Left>
            <Body>
              <Text>{item.station}</Text>
            </Body>
          </Left>
        </CardItem>
        <CardItem>
          <Image
            style={{ width: null, height: 200, flex: 1, resizeMode: 'cover' }}
            source={item.image}
          />
        </CardItem>
        <CardItem>
          <Body>
            <Text>{item.metar}</Text>
          </Body>
        </CardItem>
        <CardItem bordered />
      </Card>
    );

    let playAgain = () => {
      this.answers = [];
      this.setState(prevState => ({
        gameState: GameState.playing,
      }));
    };

    let recordAnswer = isCorrect => {
      this.answers.push(isCorrect);
    };
    let onSwipeLeft = item => {
      recordAnswer(item.flight_category === 'IFR');
    };
    let onSwipeRight = item => {
      recordAnswer(
        item.flight_category === 'VFR' || item.flight_category === 'MVFR'
      );
    };

    let onDone = () => {
      this.setState(prevState => ({
        gameState: GameState.done,
      }));
    };

    let numCorrect = () => {
      num = 0;
      for (i = 0; i < this.answers.length; i++) {
        if (this.answers[i]) {
          num++;
        }
      }
      return num;
    };

    return (
      <View style={{ flex: 1 }} padder>
        {this.state.gameState === GameState.fetching && <Spinner />}

        {this.state.gameState === GameState.playing && (
          <Swiper
            ref={c => (this.swiper = c)}
            cards={this.cards}
            renderItem={renderItem}
            onDone={onDone}
            onSwipeRight={onSwipeRight}
            onSwipeLeft={onSwipeLeft}
          />
        )}

        {this.state.gameState === GameState.done && (
          <Card style={{ elevation: 5 }}>
            <CardItem bordered>
              <Left>
                <Body>
                  <Text>
                    You got {numCorrect()} out of {this.answers.length} right!
                  </Text>
                </Body>
              </Left>
            </CardItem>
            <CardItem>
              <Button
                rounded
                primary
                style={{ marginRight: 5 }}
                onPress={playAgain}
              >
                <Text>Play again</Text>
              </Button>
              <Button rounded info>
                <Text>review answers</Text>
              </Button>
            </CardItem>
          </Card>
        )}
      </View>
    );
  }
}

class App extends React.Component {
  render() {
    return (
      <Container>
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
