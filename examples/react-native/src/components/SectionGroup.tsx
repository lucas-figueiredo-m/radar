import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type SectionGroupProps = {
  title: string;
  children: ReactNode;
};

const SectionGroup = ({ title, children }: SectionGroupProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.optionsList}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 12,
  },
  optionsList: {
    paddingHorizontal: 24,
    gap: 8,
  },
});

export default SectionGroup;
