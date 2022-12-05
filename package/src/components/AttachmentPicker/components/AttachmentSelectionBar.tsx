import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import dayjs from 'dayjs';

import { useAttachmentPickerContext } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useMessageInputContext } from '../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { takePhoto } from '../../../native';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 6,
  },
  icon: {
    marginHorizontal: 12,
  },
});

export const AttachmentSelectionBar: React.FC = () => {
  const {
    attachmentSelectionBarHeight,
    CameraSelectorIcon,
    closePicker,
    FileSelectorIcon,
    ImageSelectorIcon,
    selectedPicker,
    setSelectedFiles,
    setSelectedImages,
    setSelectedPicker,
  } = useAttachmentPickerContext();

  const { compressImageQuality, hasFilePicker, imageUploads, pickFile } = useMessageInputContext();

  const {
    theme: {
      attachmentSelectionBar: { container, icon },
    },
  } = useTheme();

  const setPicker = (selection: 'images') => {
    if (selectedPicker === selection) {
      setSelectedPicker(undefined);
      closePicker();
    } else {
      setSelectedPicker(selection);
    }
  };

  const openFilePicker = () => {
    setSelectedPicker(undefined);
    closePicker();
    pickFile();
  };

  const takeAndUploadImage = async () => {
    setSelectedPicker(undefined);
    closePicker();
    const attachment = await takePhoto({ compressImageQuality });
    if (!attachment.cancelled) {
      if (attachment.type === 'image') {
        setSelectedImages((images) => [...images, attachment]);
      } else {
        attachment.file.name = `video_${dayjs(new Date()).format('DDMMYYYY_HHMMss')}`;
        setSelectedFiles((files) => [...files, attachment.file]);
      }
    }
  };

  return (
    <View style={[styles.container, container, { height: attachmentSelectionBarHeight ?? 52 }]}>
      <TouchableOpacity
        hitSlop={{ bottom: 15, top: 15 }}
        onPress={() => setPicker('images')}
        testID='upload-photo-touchable'
      >
        <View style={[styles.icon, icon]}>
          <ImageSelectorIcon
            numberOfImageUploads={imageUploads.length}
            selectedPicker={selectedPicker}
          />
        </View>
      </TouchableOpacity>
      {hasFilePicker && (
        <TouchableOpacity
          hitSlop={{ bottom: 15, top: 15 }}
          onPress={openFilePicker}
          testID='upload-file-touchable'
        >
          <View style={[styles.icon, icon]}>
            <FileSelectorIcon
              numberOfImageUploads={imageUploads.length}
              selectedPicker={selectedPicker}
            />
          </View>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        hitSlop={{ bottom: 15, top: 15 }}
        onPress={takeAndUploadImage}
        testID='take-photo-touchable'
      >
        <View style={[styles.icon, icon]}>
          <CameraSelectorIcon
            numberOfImageUploads={imageUploads.length}
            selectedPicker={selectedPicker}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};
