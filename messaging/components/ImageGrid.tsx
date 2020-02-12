import {GetPhotosReturnType, Image, StyleSheet, TouchableOpacity} from 'react-native';
import CameraRoll from 'expo-cameraroll'
import * as Permissions from 'expo-permissions';
import React from 'react';
import Grid from './Grid';

const keyExtractor = ({uri}) => uri;

interface P {onPressImage: any}

export default class ImageGrid extends React.Component<P, { images: any[] }> {
    static defaultProps = {
        onPressImage: (string) => {},
    };

    state = {
        images: []
    };

    componentDidMount() {
        this.getImages();
    }

    private loading: boolean = false;
    private cursor?: string | null = null;

    getImages = async (after?: string) => {
        if (this.loading) return;

        const { status } = await Permissions.askAsync(
            Permissions.CAMERA_ROLL,
        );

        if (status !== 'granted') {
            console.log('Camera roll permission denied');
            return;
        }

        this.loading = true;

        const results: GetPhotosReturnType = await CameraRoll.getPhotos({
            first: 20,
            after,
            assetType: 'Photos',
        });

        const {
            edges,
            page_info: {has_next_page, end_cursor},
        } = results;

        const loadedImages = edges.map(item => item.node.image);

        this.setState(
            {
                images: this.state.images.concat(loadedImages),
            },
            () => {
                this.loading = false;
                this.cursor = has_next_page ? end_cursor : null;
            },
        );
    };

    getNextImages = () => {
        // Prevent loading the initial page after we've reached the end
        if (!this.cursor) return;

        this.getImages(this.cursor);
    };

    renderItem = ({item: {uri}, size, marginTop, marginLeft}) => {
        const {onPressImage} = this.props;

        const style = {
            width: size,
            height: size,
            marginLeft,
            marginTop,
        };

        return (
            <TouchableOpacity key={uri}
                              activeOpacity={0.75}
                              onPress={() => onPressImage(uri)}
                              style={style}>
                <Image source={{uri}} style={styles.image} />
            </TouchableOpacity>
        );
    };

    render() {
        const {images} = this.state;
        return (
            <Grid data={images}
                  renderItem={this.renderItem}
                  keyExtractor={keyExtractor}
                  onEndReached={this.getNextImages} />
        );
    }
}

const styles = StyleSheet.create({
    image: {
        flex: 1,
    },
});