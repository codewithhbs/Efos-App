import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, Image, Alert, Modal, TextInput,
    Platform, StatusBar
} from 'react-native';
import React from 'react';
import Layout from "../../components/layout";
import API from '../../utils/axiosInstanct';
import { Loader } from '../../components/LoadingAndAuthWarn';
import useAuthStore from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/dummyData';
import { SafePicker } from './Safepicker';

// ── Options ──────────────────────────────────────────────────────────────────

const OPTIONS = {
    gender: ["Male", "Female", "Other", "Prefer not to say"],
    present_status: ["Student", "Fresher", "Working Professional", "Self Employed", "Unemployed"],
    looking_for: ["Full Time Job", "Part Time Job", "Internship", "Freelance", "Higher Education", "Government Job"],
    highest_qualification: ["10th", "12th", "Diploma", "ITI", "Graduation", "Post Graduation", "PhD", "Other"],
    experience_type: ["Fresher", "0-1 Year", "1-3 Years", "3-5 Years", "5+ Years"],
    state: [
        "Delhi", "Maharashtra", "Uttar Pradesh", "Bihar", "Rajasthan", "Gujarat",
        "West Bengal", "Haryana", "Punjab", "Madhya Pradesh", "Telangana",
        "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Other"
    ],
};

// ── SafeInput ────────────────────────────────────────────────────────────────
// Oppo/OnePlus devices (OxygenOS/ColorOS) crash with SIGABRT when TextInput
// inside a Modal triggers EditableInputConnectionExtImpl.handleSendKeyEvent.
// Root cause: autoCorrect/autoCapitalize/spellCheck activate the OEM IME bridge
// that corrupts pointer tags (0x100000001).
// Fix: disable all IME enhancement flags + always blurOnSubmit.

const SafeInput = ({ style, ...props }) => (
    <TextInput
        style={[mStyles.input, style]}
        placeholderTextColor="#bbb"
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        autoComplete="off"
        blurOnSubmit
        {...props}
    />
);

// ── InfoCell ─────────────────────────────────────────────────────────────────

const InfoCell = ({ label, value, redValue }) => (
    <View style={styles.infoCell}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoVal, redValue && { color: COLORS.primary }]}>{value}</Text>
    </View>
);

// ── JobDetail ─────────────────────────────────────────────────────────────────

export default function JobDetail({ route, navigation }) {
    const { user, isAuthenticated } = useAuthStore();
    const { slug } = route.params;

    const [job, setJob] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [applying, setApplying] = React.useState(false);
    const [updating, setUpdating] = React.useState(false);
    const [profileModal, setProfileModal] = React.useState(false);

    // KEY FIX: Do not mount TextInputs until modal slide animation completes.
    // Mounting inputs during the animation is what triggers the OEM IME crash.
    const [modalReady, setModalReady] = React.useState(false);

    const [form, setForm] = React.useState({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        gender: '',
        state: '',
        district: '',
        present_status: '',
        looking_for: '',
        experience_type: '',
        highest_qualification: '',
    });

    const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    React.useEffect(() => { fetchJob(); }, []);

    const fetchJob = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/job/search/${slug}`);
            if (res.data?.success) setJob(res.data.data);
        } catch (e) {
            console.error('FetchJob Error:', e);
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setProfileModal(false);
        setModalReady(false);
    };

    const applyJob = async () => {
        if (!isAuthenticated) {
            Alert.alert('Unauthorized', 'Please login again to apply', [
                { text: 'Login', onPress: () => navigation.navigate('Login') },
                { text: 'Cancel', style: 'cancel' },
            ]);
            return;
        }
        setApplying(true);
        try {
            const res = await API.post(`/job/apply/${job.id}`);
            if (res.data?.success) {
                setJob(prev => ({ ...prev, is_applied: true }));
                Alert.alert('Success', 'Applied successfully!');
            }
        } catch (e) {
            if (e.response?.status === 422) {
                setProfileModal(true);
            } else if (e.response?.status === 401) {
                Alert.alert('Unauthorized', 'Please login again', [
                    { text: 'Login', onPress: () => navigation.navigate('Login') },
                    { text: 'Cancel', style: 'cancel' },
                ]);
            } else {
                Alert.alert('Error', e.response?.data?.message || 'Failed to apply');
            }
        } finally {
            setApplying(false);
        }
    };

    const updateProfile = async () => {
        setUpdating(true);
        try {
            const res = await API.post('/auth/update-student-profile', form);
            if (res.data?.success) {
                closeModal();
                setTimeout(() => applyJob(), 400); // wait for modal to close before re-applying
            } else {
                Alert.alert('Error', 'Update failed, please try again');
            }
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Profile update failed');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <Loader message="Loading Opportunities details..." />;
    if (!job) return null;

    const highlights = JSON.parse(job.highlights || '[]');
    const skills = job.skills?.split('\r\n\r\n').filter(Boolean) || [];
    const roleMatches = job.description?.match(
        /<p[^>]*>(Data Scientist|Data Analyst|Machine Learning Engineer|Business Intelligence Analyst|Software Engineer)<\/p>/g
    ) || [];
    const roles = roleMatches.map(r => r.replace(/<[^>]+>/g, ''));

    return (
        <Layout
            headerType="backTitle"
            title="Opportunities Details"
            onBack={() => navigation.goBack()}
            scrollable={false}>

            <View style={styles.container}>
                <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}>

                    {/* Hero */}
                    <View style={styles.hero}>
                        <View style={styles.logoWrap}>
                            {job.company_logo
                                ? <Image source={{ uri: job.company_logo }} style={styles.logo} resizeMode="contain" />
                                : <Text style={styles.logoEmoji}>🎓</Text>}
                        </View>
                        <View style={styles.heroInfo}>
                            <Text style={styles.jobTitle}>{job.title}</Text>
                            <Text style={styles.company}>{job.company_name}</Text>
                            {job.is_featured === 1 && (
                                <View style={styles.featuredBadge}>
                                    <Ionicons name="star" size={10} color={COLORS.primary} />
                                    <Text style={styles.featuredText}>Featured</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Tags */}
                    <View style={styles.tags}>
                        {job.job_type && <View style={styles.tagRed}><Text style={styles.tagRedText}>{job.job_type}</Text></View>}
                        {job.work_mode && <View style={styles.tagBlack}><Text style={styles.tagBlackText}>{job.work_mode}</Text></View>}
                        {job.shift && <View style={styles.tagGray}><Text style={styles.tagGrayText}>{job.shift} Shift</Text></View>}
                        {job.district && <View style={styles.tagGray}><Text style={styles.tagGrayText}>{job.district}</Text></View>}
                    </View>

                    <View style={styles.divider} />

                    {/* Info Grid */}
                    <View style={styles.infoGrid}>
                        <InfoCell label="Package" value={job.salary} redValue />
                        <InfoCell label="Experience" value={job.experience} />
                        <InfoCell label="Education" value={job.education} />
                        <InfoCell label="Age Limit" value={job.age_limit ? `${job.age_limit} yrs` : '—'} />
                    </View>

                    {/* Highlights */}
                    {highlights.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.secHeader}>
                                <View style={styles.secBar} />
                                <Text style={styles.secTitle}>Highlights</Text>
                            </View>
                            {highlights.map((h, i) => (
                                <View key={i} style={styles.hlRow}>
                                    <View style={styles.hlDot} />
                                    <Text style={styles.hlText}>{h}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {skills.length > 0 && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.section}>
                                <View style={styles.secHeader}>
                                    <View style={styles.secBar} />
                                    <Text style={styles.secTitle}>Skills Covered</Text>
                                </View>
                                <View style={styles.skillsWrap}>
                                    {skills.map((s, i) => (
                                        <View key={i} style={styles.skillChip}>
                                            <Text style={styles.skillText}>{s.trim()}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}

                    {roles.length > 0 && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.section}>
                                <View style={styles.secHeader}>
                                    <View style={styles.secBar} />
                                    <Text style={styles.secTitle}>Career Roles</Text>
                                </View>
                                <View style={styles.descBox}>
                                    <Text style={styles.descText}>Graduates prepared for fast-growing data-driven roles:</Text>
                                    {roles.map((r, i) => (
                                        <View key={i} style={styles.roleRow}>
                                            <Text style={styles.roleArrow}>→</Text>
                                            <Text style={styles.roleText}>{r}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}

                    {job.eligibility && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.section}>
                                <View style={styles.secHeader}>
                                    <View style={styles.secBar} />
                                    <Text style={styles.secTitle}>Eligibility</Text>
                                </View>
                                <Text style={styles.eligText}>{job.eligibility}</Text>
                            </View>
                        </>
                    )}
                </ScrollView>

                {/* Bottom Bar */}
                <View style={styles.bottomBar}>
                    <TouchableOpacity style={styles.saveBtn}>
                        <Ionicons name="bookmark-outline" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.applyBtn, job.is_applied && styles.applyBtnApplied]}
                        onPress={applyJob}
                        disabled={job.is_applied || applying}
                        activeOpacity={0.85}>
                        {job.is_applied
                            ? <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.applyText}>  Applied</Text></>
                            : <Text style={styles.applyText}>{applying ? 'Applying...' : 'Apply Now'}</Text>}
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Profile Completion Modal ──────────────────────────────── */}
            <Modal
                visible={profileModal}
                animationType="slide"
                presentationStyle="fullScreen"
                statusBarTranslucent
                onShow={() => setModalReady(true)}
                onDismiss={() => setModalReady(false)}
                onRequestClose={closeModal}>

                <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

                <View style={mStyles.screen}>

                    {/* Header */}
                    <View style={mStyles.header}>
                        <View>
                            <Text style={mStyles.headerTitle}>Complete Profile</Text>
                            <Text style={mStyles.headerSub}>Required to apply for this job</Text>
                        </View>
                        <TouchableOpacity style={mStyles.closeBtn} onPress={closeModal}>
                            <Ionicons name="close" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Render form only after modal is fully open */}
                    {modalReady ? (
                        <>
                            <ScrollView
                                style={mStyles.scroll}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={mStyles.scrollContent}
                                keyboardShouldPersistTaps="handled">

                                {/* ── Basic Info ── */}
                                <Text style={mStyles.groupLabel}>Basic Info</Text>

                                <Text style={mStyles.fieldLabel}>Full Name</Text>
                                <SafeInput
                                    placeholder="Enter full name"
                                    value={form.name}
                                    onChangeText={v => setField('name', v)}
                                />

                                <Text style={mStyles.fieldLabel}>Phone</Text>
                                <SafeInput
                                    placeholder="Enter phone number"
                                    value={form.phone}
                                    onChangeText={v => setField('phone', v)}
                                    keyboardType="number-pad"
                                />

                                <Text style={mStyles.fieldLabel}>Email</Text>
                                <SafeInput
                                    placeholder="Enter email address"
                                    value={form.email}
                                    onChangeText={v => setField('email', v)}
                                    keyboardType="email-address"
                                />

                                <Text style={mStyles.fieldLabel}>Gender</Text>
                                <SafePicker
                                    label="Gender"
                                    value={form.gender}
                                    options={OPTIONS.gender}
                                    onChange={v => setField('gender', v)}
                                />

                                {/* ── Location ── */}
                                <Text style={[mStyles.groupLabel, { marginTop: 24 }]}>Location</Text>

                                <Text style={mStyles.fieldLabel}>State</Text>
                                <SafePicker
                                    label="State"
                                    value={form.state}
                                    options={OPTIONS.state}
                                    onChange={v => setField('state', v)}
                                />

                                <Text style={mStyles.fieldLabel}>District / City</Text>
                                <SafeInput
                                    placeholder="Enter district or city"
                                    value={form.district}
                                    onChangeText={v => setField('district', v)}
                                />

                                {/* ── Career ── */}
                                <Text style={[mStyles.groupLabel, { marginTop: 24 }]}>Career</Text>

                                <Text style={mStyles.fieldLabel}>Present Status</Text>
                                <SafePicker
                                    label="Present Status"
                                    value={form.present_status}
                                    options={OPTIONS.present_status}
                                    onChange={v => setField('present_status', v)}
                                />

                                <Text style={mStyles.fieldLabel}>Looking For</Text>
                                <SafePicker
                                    label="Looking For"
                                    value={form.looking_for}
                                    options={OPTIONS.looking_for}
                                    onChange={v => setField('looking_for', v)}
                                />

                                <Text style={mStyles.fieldLabel}>Experience</Text>
                                <SafePicker
                                    label="Experience"
                                    value={form.experience_type}
                                    options={OPTIONS.experience_type}
                                    onChange={v => setField('experience_type', v)}
                                />

                                <Text style={mStyles.fieldLabel}>Highest Qualification</Text>
                                <SafePicker
                                    label="Highest Qualification"
                                    value={form.highest_qualification}
                                    options={OPTIONS.highest_qualification}
                                    onChange={v => setField('highest_qualification', v)}
                                />

                                <View style={{ height: 24 }} />
                            </ScrollView>

                            {/* Footer */}
                            <View style={mStyles.footer}>
                                <TouchableOpacity
                                    style={[mStyles.submitBtn, updating && mStyles.submitBtnDisabled]}
                                    onPress={updateProfile}
                                    disabled={updating}
                                    activeOpacity={0.85}>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                    <Text style={mStyles.submitText}>
                                        {updating ? 'Saving...' : 'Save & Apply'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={mStyles.loadingWrap}>
                            <Ionicons name="person-circle-outline" size={52} color={COLORS.primary} />
                            <Text style={mStyles.loadingText}>Loading...</Text>
                        </View>
                    )}
                </View>
            </Modal>
        </Layout>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 8 },
    hero: { flexDirection: 'row', padding: 20, gap: 14, alignItems: 'flex-start' },
    logoWrap: {
        width: 64, height: 64, borderRadius: 14,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1.5, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
    },
    logo: { width: 48, height: 48, borderRadius: 10 },
    logoEmoji: { fontSize: 26 },
    heroInfo: { flex: 1 },
    jobTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, lineHeight: 21, marginBottom: 4 },
    company: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
    featuredBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start',
    },
    featuredText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 20, paddingBottom: 16 },
    tagRed: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    tagRedText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
    tagBlack: { backgroundColor: COLORS.secondary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    tagBlackText: { fontSize: 11, color: COLORS.white, fontWeight: '600' },
    tagGray: { backgroundColor: COLORS.card, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
    tagGrayText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
    divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 20 },
    infoGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        margin: 16, borderRadius: 14,
        overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border,
    },
    infoCell: {
        width: '50%', backgroundColor: COLORS.card,
        padding: 12, borderWidth: 0.5, borderColor: COLORS.border,
    },
    infoLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
    infoVal: { fontSize: 13, fontWeight: '700', color: COLORS.text },
    section: { padding: 16, paddingTop: 16 },
    secHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    secBar: { width: 3, height: 16, backgroundColor: COLORS.primary, borderRadius: 2 },
    secTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
    hlRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
    hlDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 5 },
    hlText: { flex: 1, fontSize: 13, color: '#333', lineHeight: 20 },
    skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    skillChip: {
        backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    },
    skillText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
    descBox: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14 },
    descText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 8 },
    roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
    roleArrow: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
    roleText: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
    eligText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 20 },
    bottomBar: {
        flexDirection: 'row', gap: 10,
        padding: 12, paddingBottom: 24,
        backgroundColor: COLORS.bg,
        borderTopWidth: 1, borderTopColor: COLORS.border,
    },
    saveBtn: {
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center', justifyContent: 'center',
    },
    applyBtn: {
        flex: 1, backgroundColor: COLORS.primary,
        height: 48, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'row',
    },
    applyBtnApplied: { backgroundColor: COLORS.success },
    applyText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
});

const mStyles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f7f8fa' },
    header: {
        backgroundColor: COLORS.primary,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 54,
        paddingBottom: 16, paddingHorizontal: 20,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
    groupLabel: {
        fontSize: 12, fontWeight: '800', color: COLORS.primary,
        textTransform: 'uppercase', letterSpacing: 0.8,
        marginBottom: 14, paddingBottom: 8,
        borderBottomWidth: 1.5, borderBottomColor: COLORS.primaryLight,
    },
    fieldLabel: {
        fontSize: 11, fontWeight: '700', color: '#666',
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 6, marginTop: 12,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1.5, borderColor: '#e8e8e8',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        fontSize: 14, color: '#1a1a1a',
    },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: '#aaa', fontWeight: '500' },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 32 : 46,
        backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: '#eee',
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        height: 52, borderRadius: 14,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});