import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type NetworkItemProps = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  color: string;
  onPress: () => void;
};

const NetworkItem = ({ method, path, color, onPress }: NetworkItemProps) => (
  <TouchableOpacity
    style={[styles.optionButton, { borderLeftColor: color }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.methodBadge, { backgroundColor: color }]}>
      <Text style={styles.methodText}>{method}</Text>
    </View>
    <Text style={styles.optionText}>{path}</Text>
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
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  methodText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  optionText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
});

export default NetworkItem;
