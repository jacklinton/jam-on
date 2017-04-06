import Expo, { Asset, Audio, Font } from 'expo';
import React, { Component } from 'react';
import { StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Image,
    Slider,
    Stylesheet,
    TouchableHighlight,
  } from 'react-native';
import Meteor, { createContainer } from 'react-native-meteor';
import DrawerLayout from 'react-native-drawer-layout';
const SERVER_URL = 'ws://localhost:3000/websocket';

class Icon {
  constructor(module, width, height) {
    this.module = module;
    this.width = width;
    this.height = height;
    Asset.fromModule(this.module).downloadAsync();
  }
}

class PlaylistItem {
  constructor(name, source) {
    this.name = name;
    this.source = source;
    this.sound = null;
    // this.album = album;
    // this.id = id;
  }

  async getLoadedSound() {
    if (this.sound == null) {
      if (typeof source === 'number') {
        // source is an asset module, so let's download it for better performance
        await Asset.fromModule(this.source).downloadAsync();
      }
      this.sound = new Audio.Sound({ source: this.source });
    }
    await this.sound.loadAsync();
    return this.sound;
  }
}

const PLAYLIST = [
  new PlaylistItem(
    'Glogli',
    'http://www.archive.org/download/STS9-1999-10-15.flac16/sts9-2008-07-18d1t08_Glogli.mp3',
    // this.props.track1.album,
    // this.props.track1._id
  ),
  new PlaylistItem(
    'Monkey Music',
    'http://www.archive.org/download/STS9-1999-10-15.flac16/sts9.2009-07-11.u89i.16bit-d1t04.mp3',
    // this.props.track2.album,
    // this.props.track3._id
  ),
  new PlaylistItem(
    'Intro-Creator',
    'http://www.archive.org/download/STS9-1999-10-15.flac16/sts9-2005-02-23d1t01.mp3',
    // this.props.track3.album,
    // this.props.track3._id
  ),
  new PlaylistItem(
    'Tap-In',
    'http://www.archive.org/download/STS9-1999-10-15.flac16/sts9-2008-07-16D1T04.mp3',
    // this.props.track4.album,
    // this.props.track4._id
  ),
  new PlaylistItem(
    'Love Don\'t Terrorize',
    'http://www.archive.org/download/STS9-1999-10-15.flac16/sts9-2016-02-10t02.cm300s.cp1s.16bit.mp3',
    // this.props.track5.album,
    // this.props.track5._id
  ),
  new PlaylistItem(
    'One a Day',
    'http://www.archive.org/download/STS9-1999-10-15.flac16/sts9-2008-07-18d2t04_One_a_Day.mp3',
    // this.props.track6.album,
    // this.props.track6._id
  ),
];

const ICON_PLAY_BUTTON = new Icon(
  require('./assets/images/play_button.png'),
  34,
  51
);
const ICON_PAUSE_BUTTON = new Icon(
  require('./assets/images/pause_button.png'),
  34,
  51
);
const ICON_STOP_BUTTON = new Icon(
  require('./assets/images/stop_button.png'),
  22,
  22
);
const ICON_FORWARD_BUTTON = new Icon(
  require('./assets/images/forward_button.png'),
  33,
  25
);
const ICON_BACK_BUTTON = new Icon(
  require('./assets/images/back_button.png'),
  33,
  25
);

const ICON_LOOP_ALL_BUTTON = new Icon(
  require('./assets/images/loop_all_button.png'),
  77,
  35
);
const ICON_LOOP_ONE_BUTTON = new Icon(
  require('./assets/images/loop_one_button.png'),
  77,
  35
);

const ICON_MUTED_BUTTON = new Icon(
  require('./assets/images/muted_button.png'),
  67,
  58
);
const ICON_UNMUTED_BUTTON = new Icon(
  require('./assets/images/unmuted_button.png'),
  67,
  58
);

const ICON_TRACK_1 = new Icon(require('./assets/images/track_1.png'), 166, 5);
const ICON_THUMB_1 = new Icon(require('./assets/images/thumb_1.png'), 18, 19);
const ICON_THUMB_2 = new Icon(require('./assets/images/thumb_2.png'), 15, 19);

const LOOPING_TYPE_ALL = 0;
const LOOPING_TYPE_ONE = 1;
const LOOPING_TYPE_ICONS = { 0: ICON_LOOP_ALL_BUTTON, 1: ICON_LOOP_ONE_BUTTON };

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get('window');
const BACKGROUND_COLOR = '#FFF8ED';
const DISABLED_OPACITY = 0.5;
const LOADING_STRING = '... loading ...';
const RATE_SCALE = 3.0;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.index = 0;
    this.sound = null;
    this.isSeeking = false;
    this.shouldPlayAtEndOfSeek = false;
    this.state = {
      soundName: '',
      loopingType: LOOPING_TYPE_ALL,
      muted: false,
      soundPosition: null,
      soundDuration: null,
      isPlaying: false,
      isLoading: true,
      fontLoaded: false,
      shouldCorrectPitch: true,
      volume: 1.0,
      rate: 1.0,
    };
  }

  componentWillMount() {
    Meteor.connect(SERVER_URL);
  }

  componentDidMount() {
    Expo.Audio.setIsEnabledAsync(true);
    (async () => {
       await Font.loadAsync({
         'cutive-mono-regular': require('./assets/fonts/CutiveMono-Regular.ttf'),
       });
       this.setState({ fontLoaded: true });
     })();
     this.updateSoundForIndex();
    }

    updateScreenForLoading(isLoading) {
     if (isLoading) {
       this.setState({
         soundName: LOADING_STRING,
         soundDuration: null,
         soundPosition: null,
         isLoading: true,
       });
     } else {
       this.setState({
         soundName: PLAYLIST[this.index].name,
         soundDuration: this.sound.getDurationMillis(),
         isLoading: false,
       });
     }
    }

    _updateScreenForStatus = status => {
     this.setState({
       soundPosition: status.positionMillis,
       isPlaying: status.isPlaying,
       rate: status.rate,
       muted: status.isMuted,
       volume: status.volume,
       loopingType: status.isLooping ? LOOPING_TYPE_ONE : LOOPING_TYPE_ALL,
       shouldCorrectPitch: status.shouldCorrectPitch,
     });
    };

    async advanceIndex(forward) {
     this.index = (this.index + (forward ? 1 : PLAYLIST.length - 1)) %
       PLAYLIST.length;
    }

    async updateSoundForIndex(playing) {
     if (this.sound != null) {
       await this.sound.unloadAsync();
     }
     this.updateScreenForLoading(true);
     this.sound = null;
     const sound = await PLAYLIST[this.index].getLoadedSound();
     await sound.setIsMutedAsync(this.state.muted);
     await sound.setIsLoopingAsync(this.state.loopingType === LOOPING_TYPE_ONE);
     await sound.setVolumeAsync(this.state.volume);
     await sound.setRateAsync(this.state.rate, this.state.shouldCorrectPitch);
     sound.setStatusChangeCallback(this._updateScreenForStatus);
     sound.setPlaybackFinishedCallback(() => {
       this.advanceIndex(true);
       this.updateSoundForIndex(true);
     });
     this.sound = sound;
     this.updateScreenForLoading(false);
     if (playing) {
       await this.sound.playAsync();
     }
    }

    _onPlayPausePressed = () => {
     if (this.sound != null) {
       if (this.state.isPlaying) {
         this.sound.pauseAsync();
       } else {
         this.sound.playAsync();
       }
     }
    };

    _onStopPressed = () => {
     if (this.sound != null) {
       this.sound.stopAsync();
     }
    };

    _onForwardPressed = () => {
     if (this.sound != null) {
       this.advanceIndex(true);
       this.updateSoundForIndex(this.state.isPlaying);
     }
    };

    _onBackPressed = () => {
     if (this.sound != null) {
       this.advanceIndex(false);
       this.updateSoundForIndex(this.state.isPlaying);
     }
    };

    _onMutePressed = () => {
     if (this.sound != null) {
       this.sound.setIsMutedAsync(!this.state.muted);
     }
    };

    _onLoopPressed = () => {
     if (this.sound != null) {
       this.sound.setIsLoopingAsync(this.state.loopingType !== LOOPING_TYPE_ONE);
     }
    };

    _onVolumeSliderValueChange = value => {
     if (this.sound != null) {
       this.sound.setVolumeAsync(value);
     }
    };

    _trySetRate = async (rate, shouldCorrectPitch) => {
     if (this.sound != null) {
       try {
         await this.sound.setRateAsync(rate, shouldCorrectPitch);
       } catch (error) {
         // Rate changing could not be performed, possibly because the client's Android API is too old.
       }
     }
    };

    _onRateSliderSlidingComplete = async value => {
     this._trySetRate(value * RATE_SCALE, this.state.shouldCorrectPitch);
    };

    _onPitchCorrectionPressed = async value => {
     this._trySetRate(this.state.rate, !this.state.shouldCorrectPitch);
    };

    _onSeekSliderValueChange = value => {
     if (this.sound != null && !this.isSeeking) {
       this.isSeeking = true;
       this.shouldPlayAtEndOfSeek = this.state.isPlaying;
       this.sound.pauseAsync();
     }
    };

    _onSeekSliderSlidingComplete = async value => {
     if (this.sound != null) {
       this.isSeeking = false;
       await this.sound.setPositionAsync(value * this.sound.getDurationMillis());
       if (this.shouldPlayAtEndOfSeek) {
         this.sound.playAsync();
       }
     }
    };

    _getSeekSliderPosition() {
     if (
       this.sound != null &&
       this.state.soundPosition != null &&
       this.state.soundDuration != null
     ) {
       return this.state.soundPosition / this.state.soundDuration;
     }
     return 0;
    }

    _getMMSSFromMillis(millis) {
     const totalSeconds = millis / 1000;
     const seconds = Math.floor(totalSeconds % 60);
     const minutes = Math.floor(totalSeconds / 60);

     const padWithZero = number => {
       const string = number.toString();
       if (number < 10) {
         return '0' + string;
       }
       return string;
     };
     return padWithZero(minutes) + ':' + padWithZero(seconds);
    }

    _getTimestamp() {
     if (
       this.sound != null &&
       this.state.soundPosition != null &&
       this.state.soundDuration != null
     ) {
       return `${this._getMMSSFromMillis(this.state.soundPosition)} / ${this._getMMSSFromMillis(this.state.soundDuration)}`;
     }
     return '';
    }


  render() {
    return (
      <View style={styles.container}>
        <View />
        <Text style={styles.instructions}>
          Item Count: {this.props.count}
        </Text>
        <View style={styles.nameContainer}>
          {this.state.fontLoaded
            ? <Text style={{ ...Font.style('cutive-mono-regular') }}>
                {this.state.soundName}
              </Text>
              : null}
        </View>
        <View
          style={[
            styles.playbackContainer,
            {
              opacity: this.state.isLoading ? DISABLED_OPACITY : 1.0,
            },
          ]}>
          <Slider
            style={styles.playbackSlider}
            trackImage={ICON_TRACK_1.module}
            thumbImage={ICON_THUMB_1.module}
            value={this._getSeekSliderPosition()}
            onValueChange={this._onSeekSliderValueChange}
            onSlidingComplete={this._onSeekSliderSlidingComplete}
            disabled={this.state.isLoading}
          />
          {this.state.fontLoaded
            ? <Text
                style={[
                  styles.timestamp,
                  { ...Font.style('cutive-mono-regular') },
                ]}>
                {this._getTimestamp()}
              </Text>
            : null}
        </View>
        <View
          style={[
            styles.buttonsContainerBase,
            styles.buttonsContainerTopRow,
            {
              opacity: this.state.isLoading ? DISABLED_OPACITY : 1.0,
            },
          ]}>
          <TouchableHighlight
            underlayColor={BACKGROUND_COLOR}
            style={styles.wrapper}
            onPress={this._onBackPressed}
            disabled={this.state.isLoading}>
            <Image style={styles.button} source={ICON_BACK_BUTTON.module} />
          </TouchableHighlight>
          <TouchableHighlight
            underlayColor={BACKGROUND_COLOR}
            style={styles.wrapper}
            onPress={this._onPlayPausePressed}
            disabled={this.state.isLoading}>
            <Image
              style={styles.button}
              source={
                this.state.isPlaying
                  ? ICON_PAUSE_BUTTON.module
                  : ICON_PLAY_BUTTON.module
              }
            />
          </TouchableHighlight>
          <TouchableHighlight
            underlayColor={BACKGROUND_COLOR}
            style={styles.wrapper}
            onPress={this._onStopPressed}
            disabled={this.state.isLoading}>
            <Image style={styles.button} source={ICON_STOP_BUTTON.module} />
          </TouchableHighlight>
          <TouchableHighlight
            underlayColor={BACKGROUND_COLOR}
            style={styles.wrapper}
            onPress={this._onForwardPressed}
            disabled={this.state.isLoading}>
            <Image style={styles.button} source={ICON_FORWARD_BUTTON.module} />
          </TouchableHighlight>
        </View>
        <View
          style={[
            styles.buttonsContainerBase,
            styles.buttonsContainerMiddleRow,
          ]}>
          <View style={styles.volumeContainer}>
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={this._onMutePressed}>
              <Image
                style={styles.button}
                source={
                  this.state.muted
                    ? ICON_MUTED_BUTTON.module
                    : ICON_UNMUTED_BUTTON.module
                }
              />
            </TouchableHighlight>
            <Slider
              style={styles.volumeSlider}
              trackImage={ICON_TRACK_1.module}
              thumbImage={ICON_THUMB_2.module}
              value={1}
              onValueChange={this._onVolumeSliderValueChange}
            />
          </View>
          <TouchableHighlight
            underlayColor={BACKGROUND_COLOR}
            style={styles.wrapper}
            onPress={this._onLoopPressed}>
            <Image
              style={styles.button}
              source={LOOPING_TYPE_ICONS[this.state.loopingType].module}
            />
          </TouchableHighlight>
        </View>
        <View
          style={[
            styles.buttonsContainerBase,
            styles.buttonsContainerBottomRow,
          ]}>
          {this.state.fontLoaded
            ? <Text
                style={[
                  styles.timestamp,
                  { ...Font.style('cutive-mono-regular') },
                ]}>
                Rate:
              </Text>
            : null}
          <Slider
            style={styles.rateSlider}
            trackImage={ICON_TRACK_1.module}
            thumbImage={ICON_THUMB_1.module}
            value={this.state.rate / RATE_SCALE}
            onSlidingComplete={this._onRateSliderSlidingComplete}
          />
          <TouchableHighlight
            underlayColor={BACKGROUND_COLOR}
            style={styles.wrapper}
            onPress={this._onPitchCorrectionPressed}>
            <View style={styles.button}>
              {this.state.fontLoaded
                ? <Text
                    style={[
                      styles.timestamp,
                      { ...Font.style('cutive-mono-regular') },
                    ]}>
                    PC: {this.state.shouldCorrectPitch ? 'yes' : 'no'}
                  </Text>
                : null}
            </View>
          </TouchableHighlight>
        </View>
        <View />
      </View>
    );
  }
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: BACKGROUND_COLOR,
  },
  wrapper: {},
  nameContainer: {
    height: DEVICE_HEIGHT * 2.0 / 5.0,
  },
  playbackContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: ICON_THUMB_1.height * 2.0,
    maxHeight: ICON_THUMB_1.height * 2.0,
  },
  playbackSlider: {
    alignSelf: 'stretch',
  },
  timestamp: {
    textAlign: 'right',
    alignSelf: 'stretch',
    paddingRight: 20,
  },
  button: {
    backgroundColor: BACKGROUND_COLOR,
  },
  buttonsContainerBase: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonsContainerTopRow: {
    maxHeight: ICON_PLAY_BUTTON.height,
    minWidth: DEVICE_WIDTH / 2.0,
    maxWidth: DEVICE_WIDTH / 2.0,
  },
  buttonsContainerMiddleRow: {
    maxHeight: ICON_MUTED_BUTTON.height,
    alignSelf: 'stretch',
    paddingRight: 20,
  },
  volumeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: DEVICE_WIDTH / 2.0,
    maxWidth: DEVICE_WIDTH / 2.0,
  },
  volumeSlider: {
    width: DEVICE_WIDTH / 2.0 - ICON_MUTED_BUTTON.width,
  },
  buttonsContainerBottomRow: {
    maxHeight: ICON_THUMB_1.height,
    alignSelf: 'stretch',
    paddingRight: 20,
    paddingLeft: 20,
  },
  rateSlider: {
    width: DEVICE_WIDTH / 2.0,
  },
});


Expo.registerRootComponent(createContainer(() => {
  Meteor.subscribe('songs');
  return {
    count: Meteor.collection('songs').find().length,
  };
}, App));
