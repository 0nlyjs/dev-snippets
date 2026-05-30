import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Clipboard, Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from './themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CodeViewProps {
  code: string;
  language: string;
}

export function CodeView({ code, language }: CodeViewProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(code);
        } else {
          Clipboard.setString(code);
        }
      } else {
        Clipboard.setString(code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const lines = code.split('\n');

  return (
    <View style={styles.container}>
      {/* Code Header Bar */}
      <View style={styles.header}>
        <ThemedText type="smallBold" style={styles.languageText}>
          {language.toUpperCase()}
        </ThemedText>
        
        <Pressable onPress={handleCopy} style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}>
          <SymbolView
            name={{
              ios: copied ? 'checkmark' : 'doc.on.doc',
              android: copied ? 'check' : 'content_copy',
              web: copied ? 'check' : 'content_copy',
            }}
            tintColor={copied ? '#4CAF50' : '#A0A4AA'}
            size={14}
          />
          <ThemedText type="small" style={[styles.copyText, copied && { color: '#4CAF50' }]}>
            {copied ? 'Copied' : 'Copy'}
          </ThemedText>
        </Pressable>
      </View>

      {/* Code Display Area */}
      <ScrollView horizontal style={styles.scrollHorizontal}>
        <ScrollView style={styles.scrollVertical} nestedScrollEnabled>
          <View style={styles.codeBlock}>
            {lines.map((line, index) => (
              <View key={`line-${index}`} style={styles.codeRow}>
                {/* Line Number */}
                <View style={styles.lineNumberContainer}>
                  <ThemedText type="code" style={styles.lineNumber}>
                    {String(index + 1).padStart(2, ' ')}
                  </ThemedText>
                </View>
                
                {/* Code Line Text */}
                <ThemedText type="code" style={styles.codeLine}>
                  {line || ' '}
                </ThemedText>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#151618',
    borderRadius: Spacing.three,
    overflow: 'hidden',
    alignSelf: 'stretch',
    marginVertical: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#202124',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  languageText: {
    color: '#0284F5',
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyText: {
    fontSize: 11,
    color: '#A0A4AA',
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.8,
  },
  scrollHorizontal: {
    alignSelf: 'stretch',
  },
  scrollVertical: {
    maxHeight: 400,
  },
  codeBlock: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    minWidth: 400,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 1,
  },
  lineNumberContainer: {
    width: 32,
    marginRight: Spacing.two,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  lineNumber: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.25)',
    textAlign: 'right',
  },
  codeLine: {
    fontSize: 12.5,
    color: '#E0E4EA',
    paddingLeft: Spacing.one,
    fontFamily: Platform.select({
      ios: 'Courier New',
      android: 'monospace',
      default: 'monospace',
    }),
  },
});
