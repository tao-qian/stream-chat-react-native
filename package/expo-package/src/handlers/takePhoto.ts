import { Image, Platform } from 'react-native';

import * as ImagePicker from 'expo-image-picker';

type Size = {
  height?: number;
  width?: number;
};

export const takePhoto = async ({ compressImageQuality = 1 }) => {
  try {
    const permissionCheck = await ImagePicker.getCameraPermissionsAsync();
    const permissionGranted =
      permissionCheck?.status === 'granted'
        ? permissionCheck
        : await ImagePicker.requestCameraPermissionsAsync();

    if (permissionGranted?.status === 'granted' || permissionGranted?.granted === true) {
      const attachment = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: Math.min(Math.max(0, compressImageQuality), 1),
      });

      if (
        attachment.cancelled === false &&
        attachment.height &&
        attachment.width &&
        attachment.uri
      ) {
        let size: Size = {};
        if (Platform.OS === 'android') {
          // Height and width returned by ImagePicker are incorrect on Android.
          // The issue is described in following github issue:
          // https://github.com/ivpusic/react-native-image-crop-picker/issues/901
          // This we can't rely on them as it is, and we need to use Image.getSize
          // to get accurate size.
          const getSize = (): Promise<Size> =>
            new Promise((resolve) => {
              if (attachment.uri) {
                return Image.getSize(attachment?.uri, (width, height) => {
                  resolve({ height, width });
                });
              }
            });

          try {
            const { height, width } = await getSize();
            size.height = height;
            size.width = width;
          } catch (e) {
            console.warn('Error get image size of picture caputred from camera ', e);
          }
        } else {
          size = {
            height: attachment.height,
            width: attachment.width,
          };
        }

        if (attachment.type === 'image') {
          return {
            cancelled: false,
            source: 'camera',
            type: attachment.type,
            uri: attachment.uri,
            ...size,
          };
        } else {
          return {
            cancelled: false,
            file: {
              duration: attachment.duration ? attachment.duration / 1000 : 0,
              name: attachment.fileName,
              size: attachment.fileSize,
              type:
                Platform.OS === 'ios' ? `${attachment.type}/quicktime` : `${attachment.type}/mp4`,
              uri: attachment.uri,
            },
            source: 'camera',
            type: attachment.type,
            ...size,
          };
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
  return { cancelled: true };
};
