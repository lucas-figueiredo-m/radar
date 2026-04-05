import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ActionButtonProps = {
  title: string;
  subtitle?: string;
  color: string;
  onPress: () => void;
};

const ActionButton = ({
  title,
  subtitle,
  color,
  onPress,
}: ActionButtonProps) => (
  <TouchableOpacity
    style={[styles.button, { borderLeftColor: color }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.dot, { backgroundColor: color }]} />
    <View style={styles.textContainer}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderLeftWidth: 3,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});

export default ActionButton;
