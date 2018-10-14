import React from 'react';
import pickRandom from 'pick-random';
import { parseString } from 'react-native-xml2js';
import {
  Animated,
  FlatList,
  Image,
  PanResponder,
  StyleSheet,
} from 'react-native';
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

const NUM_CARDS_PER_GAME = 3;
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
    this.callListeners(vx);
    Animated.decay(this.state.pan, {
      velocity: { x: vx, y: vy },
      deceleration: 0.98,
    }).start(this.advance.bind(this));
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
    let bottomStyle = [
      {
        elevation: 3,
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
      });
    }

    return (
      <View>
        {this.state.currentIdx < this.props.cards.length - 1 && (
          <Animated.View
            style={{ elevation: 3, transform: [{ scale: this.state.scale }] }}
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
  playing: 1,
  done: 2,
});

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
      let flight_category;
      if (metar.flight_category === 'MVFR') {
        flight_category = 'VFR';
      } else {
        flight_category = metar.flight_category;
      }

      cards.push({
        station: metar.station_id,
        metar: metar.raw_text,
        flight_category: flight_category,
        answer: null,
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
      </View>
    );

    let renderQuizCard = item => (
      <Card style={{ height: 380 }}>
        <CardItem bordered>
          <Left>
            <Body>
              <Text>{item.station}</Text>
            </Body>
          </Left>
        </CardItem>
        {renderMetar(item)}
      </Card>
    );

    let renderAnswerCard = ({ item }) => {
      let correctState;
      if (item.flight_category === item.answer) {
        correctState = (
          <Icon name="md-checkmark-circle" style={{ color: 'green' }} />
        );
      } else {
        correctState = <Icon name="md-close-circle" style={{ color: 'red' }} />;
      }

      return (
        <Card>
          <CardItem bordered>
            <Left>
              <Body>
                <Text>{item.station}</Text>
              </Body>
            </Left>
            <Right>{correctState}</Right>
          </CardItem>
          {renderMetar(item)}
          <CardItem bordered>
            <Body>
              <Text>Flight category: {item.flight_category}</Text>
              <Text>Your answer: {item.answer}</Text>
            </Body>
          </CardItem>
        </Card>
      );
    };

    let playAgain = () => {
      this.setState(prevState => ({
        gameState: GameState.fetching,
      }));
      this.getCards();
    };

    let onSwipeLeft = item => {
      item.answer = 'IFR';
    };
    let onSwipeRight = item => {
      item.answer = 'VFR';
    };

    let onDone = () => {
      this.setState(prevState => ({
        gameState: GameState.done,
      }));
    };

    let getResultText = () => {
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
    };

    let renderResultsHeader = () => {
      return (
        <Card style={{ elevation: 3 }}>
          <CardItem>
            <Left>
              <Body>{getResultText()}</Body>
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
      <View style={{ flex: 1 }} padder>
        {this.state.gameState === GameState.fetching && (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Card style={{ elevation: 3 }}>
              <Spinner />
              <CardItem>
                <Body>
                  <Text>
                    Just a second while we dial{' '}
                    <Text style={{ fontWeight: 'bold' }}>
                      aviationweather.gov
                    </Text>{' '}
                    to get the latest weather reports!
                  </Text>
                </Body>
              </CardItem>
            </Card>
          </View>
        )}

        {this.state.gameState === GameState.playing && (
          <View style={{ flex: 1, justifyContent: 'center' }}>
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
                  flexDirection: 'row',
                  justifyContent: 'space-between',
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
            keyExtractor={(item, index) => item.station}
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
