

import React from 'react';
import {
    View, Text, TouchableOpacity, Modal,
    ScrollView, StyleSheet, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/dummyData';

export function SafePicker({ label, value, options = [], onChange }) {
    const [open, setOpen] = React.useState(false);

    const displayValue = value || `Select ${label}`;
    const hasValue = !!value;

    return (
        <>
            {/* Trigger */}
            <TouchableOpacity
                style={sp.trigger}
                onPress={() => setOpen(true)}
                activeOpacity={0.7}>
                <Text style={[sp.triggerText, !hasValue && sp.placeholder]}>
                    {displayValue}
                </Text>
                <Ionicons name="chevron-down" size={16} color={hasValue ? '#444' : '#bbb'} />
            </TouchableOpacity>

            {/* Picker Sheet — nested Modal is safe inside a parent Modal */}
            <Modal
                visible={open}
                transparent
                animationType="slide"
                onRequestClose={() => setOpen(false)}>

                <TouchableOpacity
                    style={sp.backdrop}
                    activeOpacity={1}
                    onPress={() => setOpen(false)} />

                <View style={sp.sheet}>
                    {/* Handle */}
                    <View style={sp.handle} />

                    {/* Title */}
                    <View style={sp.sheetHeader}>
                        <Text style={sp.sheetTitle}>{label}</Text>
                        <TouchableOpacity onPress={() => setOpen(false)}>
                            <Ionicons name="close-circle" size={22} color="#ccc" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={sp.list}
                        showsVerticalScrollIndicator={false}
                        bounces={false}>
                        {options.map((opt) => {
                            const selected = opt === value;
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    style={[sp.option, selected && sp.optionSelected]}
                                    onPress={() => {
                                        onChange(opt);
                                        setOpen(false);
                                    }}
                                    activeOpacity={0.7}>
                                    <Text style={[sp.optionText, selected && sp.optionTextSelected]}>
                                        {opt}
                                    </Text>
                                    {selected && (
                                        <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                        <View style={{ height: 24 }} />
                    </ScrollView>
                </View>
            </Modal>
        </>
    );
}

const sp = StyleSheet.create({
    trigger: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 1.5, borderColor: '#e8e8e8',
        borderRadius: 12,
        paddingHorizontal: 14, height: 48,
    },
    triggerText: { fontSize: 14, color: '#1a1a1a', flex: 1 },
    placeholder: { color: '#bbb' },

    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingHorizontal: 16, paddingTop: 10,
        maxHeight: '65%',
        // Android shadow
        elevation: 20,
        // iOS shadow
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12, shadowRadius: 16,
    },
    handle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: '#e0e0e0', alignSelf: 'center', marginBottom: 12,
    },
    sheetHeader: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
        marginBottom: 6,
    },
    sheetTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
    list: { flex: 1 },
    option: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14, paddingHorizontal: 4,
        borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
    },
    optionSelected: { backgroundColor: COLORS.primaryLight, borderRadius: 10, paddingHorizontal: 10 },
    optionText: { fontSize: 14, color: '#333' },
    optionTextSelected: { color: COLORS.primary, fontWeight: '700' },
});