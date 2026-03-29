import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ConsoleOptionProps = {
  title: string;
  color: string;
  onPress: () => void;
};

const ConsoleOption = ({ title, color, onPress }: ConsoleOptionProps) => (
  <TouchableOpacity
    style={[styles.optionButton, { borderLeftColor: color }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.optionDot, { backgroundColor: color }]} />
    <Text style={styles.optionText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderLeftWidth: 3,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  optionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optionText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
});

export default ConsoleOption;
