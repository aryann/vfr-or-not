import React from "react";
import { Animated, Image, PanResponder, StyleSheet } from "react-native";
import clamp from "clamp";
import getTheme from "./native-base-theme/components";
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
  View
} from "native-base";
//import {DeckSwiper} from './DeckSwiper';
import SwipeCards from "react-native-swipe-cards";

export default class Setup extends React.Component {
  constructor() {
    super();
    this.state = {
      isReady: false
    };
  }
  componentWillMount() {
    this.loadFonts();
  }
  async loadFonts() {
    await Expo.Font.loadAsync({
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      Ionicons: require("@expo/vector-icons/fonts/Ionicons.ttf")
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

const cards = [
  {
    station: "KRNT",
    metar:
      "KRNT 231853Z 07003KT 10SM FEW026 FEW060 SCT100 BKN200 28/21 A2990 RMK AO2 SLP125 VCSH NE-E T02780211",
    is_vfr: true
  },
  {
    station: "KPAE",
    metar:
      "KPAE 231753Z 28004KT 10SM FEW130 FEW200 28/M08 A3006 RMK AO2 SLP095 T02831078 10283 20139 58010",
    is_vfr: true
  },
  {
    station: "KSEA",
    metar:
      "KSEA 231853Z VRB06KT 10SM FEW020 SCT060 16/07 A3018 RMK AO2 SLP225 T01610072",
    is_vfr: false
  }
];

const pics = [
  require("./images/pexels-photo-113585.jpeg"),
  require("./images/pexels-photo-1309644.jpeg"),
  require("./images/pexels-photo-723240.jpeg"),
  require("./images/pexels-photo-730778.jpeg")
];

const styles = StyleSheet.create({
  card: {
    elevation: 5,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0
  }
});

class Item extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Card>
        <CardItem bordered>
          <Left>
            <Body>
              <Text>{this.props.item.station}</Text>
            </Body>
          </Left>
        </CardItem>
        <CardItem>
          <Image
            style={{ width: null, height: 200, flex: 1, resizeMode: "cover" }}
            source={this.props.item.image}
          />
        </CardItem>
        <CardItem>
          <Body>
            <Text>{this.props.item.metar}</Text>
          </Body>
        </CardItem>
        <CardItem bordered />
      </Card>
    );
  }
}

class Swiper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentIdx: 0,
      pan: new Animated.ValueXY(),
      fadeIn: new Animated.Value(0),
      scale: new Animated.Value(0.8)
    };

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => true,
      onStartShouldSetPanResponderCapture: (event, gestureState) => true,
      onMoveShouldSetPanResponder: (event, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (event, gestureState) => true,

      onPanResponderGrant: (event, gestureState) => {
        this.state.pan.setOffset({
          x: this.state.pan.x._value,
          y: this.state.pan.y._value
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
          friction: 7
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
            deceleration: 0.98
          }).start(this.advance.bind(this));
        } else {
          Animated.spring(this.state.pan, {
            toValue: { x: 0, y: 0 },
            friction: 4
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
      }
    });
  }

  resetAnimationState() {
    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.fadeIn.setValue(0.8);
    this.state.scale.setValue(0.8);
  }

  advance() {
    this.resetAnimationState();
    this.setState(prevState => ({
      currentIdx: prevState.currentIdx + 1
    }));
  }

  reset() {
    console.log("reset");
    this.resetAnimationState();
    this.setState(prevState => ({
      currentIdx: 0
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
        {this.state.currentIdx === this.props.cards.length &&
          this.props.renderEmpty()}

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
                  { translateY: this.state.pan.y }
                ]
              }
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

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.answers = [];
    this.cards = cards;
    this.cards.forEach(element => {
      element.image = this.getRandomImage();
    });
  }

  getRandomImage() {
    var idx = Math.floor(Math.random() * Math.floor(pics.length));
    return pics[idx];
  }

  render() {
    let renderItem = item => <Item item={item} />;

    let renderEmpty = () => (
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
    );

    let playAgain = () => {
      this.answers = [];
      this.swiper.reset();
    };

    let recordAnswer = isCorrect => {
      this.answers.push(isCorrect);
    };
    let onSwipeLeft = item => {
      recordAnswer(!item.is_vfr);
    };
    let onSwipeRight = item => {
      console.log(item);
      recordAnswer(item.is_vfr);
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
        <Swiper
          ref={c => (this.swiper = c)}
          cards={this.cards}
          renderItem={renderItem}
          renderEmpty={renderEmpty}
          onSwipeRight={onSwipeRight}
          onSwipeLeft={onSwipeLeft}
        />
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
