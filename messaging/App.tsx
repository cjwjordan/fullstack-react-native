import {Alert, BackHandler, Image, NativeEventSubscription, StyleSheet, TouchableHighlight, View} from 'react-native';
import React, {ReactNode} from 'react';
import Status from './components/Status';
import MessageList from './components/MessageList';
import {createImageMessage, createLocationMessage, createTextMessage, MessageShape,} from './utils/MessageUtils';
import Toolbar from './components/Toolbar';
import ImageGrid from './components/ImageGrid';
import KeyboardState from './components/KeyboardState';
import MeasureLayout from './components/MeasureLayout';
import MessagingContainer, {INPUT_METHOD} from './components/MessagingContainer';

export default class App extends React.Component {
    state = {
        messages: [
            createImageMessage('https://unsplash.it/300/300'),
            createTextMessage('World'),
            createTextMessage('Hello'),
            createLocationMessage({
                latitude: 37.78825,
                longitude: -122.4324,
            })
        ],
        fullscreenImageId: null,
        isInputFocused: false,
        inputMethod: INPUT_METHOD.NONE,
    };

    private backHandlerSubscription: NativeEventSubscription;

    componentDidMount() {
        this.backHandlerSubscription = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                const {fullscreenImageId} = this.state;
                if (fullscreenImageId) {
                    this.dismissFullscreenImage();
                    return true;
                }
                return false;
            },
        );
    }

    componentWillUnmount() {
        this.backHandlerSubscription.remove();
    }

    dismissFullscreenImage = (): void => {
        this.setState({fullscreenImageId: null});
    };

    handlePressToolbarCamera = () => {
        this.setState({isInputFocused: false, inputMethod: INPUT_METHOD.CUSTOM});
    };

    handlePressToolbarLocation = () => {
        const {messages} = this.state;

        navigator.geolocation.getCurrentPosition(position => {
            const {coords: {latitude, longitude}} = position;
            console.log(`Received coordinates: ${latitude}, ${longitude}`);
            this.setState({
                messages: [
                    createLocationMessage({
                        latitude,
                        longitude,
                    }),
                    ...messages,
                ],
            });
        });
    };

    handlePressMessage = (msg: MessageShape) => {
        const {id, type} = msg;
        switch (type) {
        case 'text':
            Alert.alert(
                'Delete message?',
                'Are you sure you want to permanently delete this message?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                            const {messages} = this.state;
                            this.setState({messages: messages.filter(message => message.id !== id)});
                        }
                    }
                ]
            );
            break;
        case 'image':
            this.setState({
                fullscreenImageId: id,
                isInputFocused: false
            });
            break;
        default:
            break;
        }
    };

    handlePressImage = uri => {
        const {messages} = this.state;

        this.setState({messages: [createImageMessage(uri), ...messages]});
    };

    handleSubmit = (text) => {
        const {messages} = this.state;
        this.setState({messages: [createTextMessage(text), ...messages]});
    };

    handleChangeFocus = (isFocused) => {
        this.setState({isInputFocused: isFocused});
    };

    handleChangeInputMethod = inputMethod => {
        this.setState({inputMethod});
    };

    renderMessageList(): ReactNode {
        const {messages} = this.state;
        return (
            <View style={styles.content}>
                <MessageList messages={messages} onPressMessage={this.handlePressMessage} />
            </View>
        );
    }

    renderInputMethodEditor = () => (
        <View style={styles.inputMethodEditor}>
            <ImageGrid onPressImage={this.handlePressImage} />
        </View>
    );

    renderToolbar() {
        const {isInputFocused} = this.state;

        return (
            <View style={styles.toolbar}>
                <Toolbar isFocused={isInputFocused}
                         onSubmit={this.handleSubmit}
                         onChangeFocus={this.handleChangeFocus}
                         onPressCamera={this.handlePressToolbarCamera}
                         onPressLocation={this.handlePressToolbarLocation} />
            </View>
        );
    }

    renderFullscreenImage = (): ReactNode | null => {
        const {messages, fullscreenImageId} = this.state;
        if (!fullscreenImageId) return null;
        const image = messages.find(message => message.id === fullscreenImageId);
        if (!image) return null;
        const {uri} = image;
        return (
            <TouchableHighlight style={styles.fullscreenOverlay} onPress={this.dismissFullscreenImage}>
                <Image style={styles.fullscreenImage} source={{uri}} />
            </TouchableHighlight>
        );
    };

    render() {
        const {inputMethod} = this.state;
        return (
            <View style={styles.container}>
                <Status />
                <MeasureLayout>
                    {layout => (
                        <KeyboardState layout={layout}>
                            {keyboardInfo => (
                                <MessagingContainer {...keyboardInfo}
                                                    inputMethod={inputMethod}
                                                    onChangeInputMethod={this.handleChangeInputMethod}
                                                    renderInputMethodEditor={this.renderInputMethodEditor}>
                                    {this.renderMessageList()}
                                    {this.renderToolbar()}
                                </MessagingContainer>
                            )}
                        </KeyboardState>
                    )}
                </MeasureLayout>
                {this.renderFullscreenImage()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    content: {
        flex: 1,
        backgroundColor: 'white',
    },
    inputMethodEditor: {
        flex: 1,
        backgroundColor: 'white',
    },
    toolbar: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.04)',
        backgroundColor: 'white',
    },
    fullscreenOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'black',
        zIndex: 2,
    },
    fullscreenImage: {
        flex: 1,
        resizeMode: 'contain',
    },
});