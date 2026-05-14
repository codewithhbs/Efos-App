import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, Image, Alert, Modal, TextInput,
    StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import React from 'react'
import Layout from "../../components/layout";
import API from '../../utils/axiosInstanct';
import { Loader } from '../../components/LoadingAndAuthWarn';
import useAuthStore from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/dummyData';
import { SafePicker } from '../JobDetails/Safepicker';

// ─── Constants ────────────────────────────────────────────────────────────────
const OPTIONS = {
    age_group: ["18-22", "23-28", "29-35", "36-45", "46-60", "60+"],
    gender: ["Male", "Female", "Other", "Prefer not to say"],
    present_status: ["Student", "Fresher", "Working Professional", "Self Employed", "Unemployed"],
    looking_for: ["Full Time Job", "Part Time Job", "Internship", "Freelance", "Higher Education", "Government Job"],
    highest_qualification: ["10th", "12th", "Diploma", "ITI", "Graduation", "Post Graduation", "PhD", "Other"],
    passport: ["Yes", "No"],
    relocation: ["Yes", "No", "Maybe"],
    blood_group: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    skill_type: ["Technical", "Non-Technical", "Vocational", "Digital", "Soft Skills"],
    experience_type: ["Fresher", "0-1 Year", "1-3 Years", "3-5 Years", "5+ Years"],
    state: ["Delhi", "Maharashtra", "Uttar Pradesh", "Bihar", "Rajasthan", "Gujarat", "West Bengal", "Haryana", "Punjab", "Madhya Pradesh", "Other"],
    category: ["General", "OBC", "SC", "ST", "EWS"],
    tenth_stream: ["Science", "Commerce", "Arts", "General"],
    twelfth_stream: ["Science (PCM)", "Science (PCB)", "Commerce", "Arts", "Other"],
    graduation_stream: ["Engineering", "Medical", "Arts", "Commerce", "Science", "Law", "Management", "Other"],
    pg_stream: ["MBA", "M.Tech", "M.Sc", "M.A", "M.Com", "LLM", "Other"],
};

const SECTIONS = [
    {
        key: 'personal',
        title: 'Personal Info',
        icon: 'person-outline',
        fields: [
            { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter full name' },
            { key: 'phone', label: 'Phone', type: 'text', placeholder: 'Enter phone number', keyboardType: 'phone-pad' },
            { key: 'email', label: 'Email', type: 'text', placeholder: 'Enter email', keyboardType: 'email-address' },
            { key: 'whatsapp', label: 'WhatsApp', type: 'text', placeholder: 'WhatsApp number', keyboardType: 'phone-pad' },
            { key: 'age_group', label: 'Age Group', type: 'picker', options: OPTIONS.age_group },
            { key: 'gender', label: 'Gender', type: 'picker', options: OPTIONS.gender },
            { key: 'blood_group', label: 'Blood Group', type: 'picker', options: OPTIONS.blood_group },
            { key: 'category', label: 'Category', type: 'picker', options: OPTIONS.category },
            { key: 'father_name', label: "Father's Name", type: 'text', placeholder: "Enter father's name" },
            { key: 'mother_name', label: "Mother's Name", type: 'text', placeholder: "Enter mother's name" },
        ]
    },
    {
        key: 'location',
        title: 'Location',
        icon: 'location-outline',
        fields: [
            { key: 'state', label: 'State', type: 'picker', options: OPTIONS.state },
            { key: 'district', label: 'District', type: 'text', placeholder: 'Enter district' },
            { key: 'pincode', label: 'Pincode', type: 'text', placeholder: 'Enter pincode', keyboardType: 'numeric' },
            { key: 'address', label: 'Address', type: 'text', placeholder: 'Enter full address', multiline: true },
        ]
    },
    {
        key: 'career',
        title: 'Career',
        icon: 'briefcase-outline',
        fields: [
            { key: 'present_status', label: 'Present Status', type: 'picker', options: OPTIONS.present_status },
            { key: 'looking_for', label: 'Looking For', type: 'picker', options: OPTIONS.looking_for },
            { key: 'experience_type', label: 'Experience', type: 'picker', options: OPTIONS.experience_type },
            { key: 'passport', label: 'Passport', type: 'picker', options: OPTIONS.passport },
            { key: 'relocation', label: 'Open to Relocation', type: 'picker', options: OPTIONS.relocation },
            { key: 'profile_summary', label: 'Profile Summary', type: 'text', placeholder: 'Write a short summary...', multiline: true },
        ]
    },
    {
        key: 'education',
        title: 'Education',
        icon: 'school-outline',
        fields: [
            { key: 'highest_qualification', label: 'Highest Qualification', type: 'picker', options: OPTIONS.highest_qualification },
            { key: 'tenth_board', label: '10th Board', type: 'text', placeholder: 'e.g. CBSE, ICSE' },
            { key: 'tenth_year', label: '10th Year', type: 'text', placeholder: 'Passing year', keyboardType: 'numeric' },
            { key: 'tenth_marks', label: '10th Marks (%)', type: 'text', placeholder: 'e.g. 85', keyboardType: 'numeric' },
            { key: 'tenth_stream', label: '10th Stream', type: 'picker', options: OPTIONS.tenth_stream },
            { key: 'twelfth_board', label: '12th Board', type: 'text', placeholder: 'e.g. CBSE' },
            { key: 'twelfth_year', label: '12th Year', type: 'text', placeholder: 'Passing year', keyboardType: 'numeric' },
            { key: 'twelfth_marks', label: '12th Marks (%)', type: 'text', placeholder: 'e.g. 80', keyboardType: 'numeric' },
            { key: 'twelfth_stream', label: '12th Stream', type: 'picker', options: OPTIONS.twelfth_stream },
            { key: 'graduation_university', label: 'University', type: 'text', placeholder: 'Graduation university' },
            { key: 'graduation_year', label: 'Grad. Year', type: 'text', placeholder: 'Passing year', keyboardType: 'numeric' },
            { key: 'graduation_marks', label: 'Grad. Marks (%)', type: 'text', placeholder: 'e.g. 75', keyboardType: 'numeric' },
            { key: 'graduation_stream', label: 'Grad. Stream', type: 'picker', options: OPTIONS.graduation_stream },
            { key: 'graduation_field', label: 'Grad. Field', type: 'text', placeholder: 'e.g. Computer Science' },
            { key: 'pg_university', label: 'PG University', type: 'text', placeholder: 'PG university name' },
            { key: 'pg_year', label: 'PG Year', type: 'text', placeholder: 'Passing year', keyboardType: 'numeric' },
            { key: 'pg_marks', label: 'PG Marks (%)', type: 'text', placeholder: 'e.g. 70', keyboardType: 'numeric' },
            { key: 'pg_stream', label: 'PG Stream', type: 'picker', options: OPTIONS.pg_stream },
            { key: 'pg_field', label: 'PG Field', type: 'text', placeholder: 'e.g. Data Science' },
        ]
    },
    {
        key: 'skills',
        title: 'Skills',
        icon: 'flash-outline',
        fields: [
            { key: 'skill_type', label: 'Skill Type', type: 'picker', options: OPTIONS.skill_type },
            { key: 'skill_trade', label: 'Skill / Trade', type: 'text', placeholder: 'e.g. React Native, Welding' },
            { key: 'skill_year', label: 'Skill Experience (yrs)', type: 'text', placeholder: 'e.g. 2', keyboardType: 'numeric' },
        ]
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const InfoCell = ({ label, value, redValue }) => (
    <View style={styles.infoCell}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoVal, redValue && { color: COLORS.primary }]}>{value}</Text>
    </View>
);

const SectionTab = ({ section, active, onPress }) => (
    <TouchableOpacity
        style={[mStyles.tab, active && mStyles.tabActive]}
        onPress={onPress}
        activeOpacity={0.8}>
        <Ionicons name={section.icon} size={14} color={active ? COLORS.primary : '#999'} />
        <Text style={[mStyles.tabText, active && mStyles.tabTextActive]}>{section.title}</Text>
    </TouchableOpacity>
);

const FieldInput = ({ field, value, onChange }) => {
    // Use SafePicker (JS-only bottom sheet) instead of native Picker.
    // The native @react-native-picker/picker causes SIGABRT (pointer tag truncation)
    // on Android when mounted inside a full-screen Modal.
    if (field.type === 'picker') {
        return (
            <SafePicker
                label={field.label}
                value={value}
                options={field.options}
                onChange={onChange}
            />
        );
    }
    return (
        <TextInput
            style={[mStyles.input, field.multiline && mStyles.inputMulti]}
            placeholder={field.placeholder}
            placeholderTextColor="#bbb"
            value={value}
            onChangeText={onChange}
            keyboardType={field.keyboardType || 'default'}
            multiline={field.multiline}
            numberOfLines={field.multiline ? 3 : 1}
            autoCapitalize="words"
        />
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function JobDetail({ route, navigation }) {
    const { user, isAuthenticated } = useAuthStore();
    const { slug } = route.params;
    const [job, setJob] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [applying, setApplying] = React.useState(false);
    const [profileModal, setProfileModal] = React.useState(false);
    const [activeSection, setActiveSection] = React.useState(0);
    const [updating, setUpdating] = React.useState(false);

    const [form, setForm] = React.useState({
        name: user?.name || "",
        phone: user?.phone || "",
        email: user?.email || "",
        whatsapp: "",
        age_group: "",
        gender: "",
        state: "",
        district: "",
        pincode: "",
        address: "",
        present_status: "",
        looking_for: "",
        highest_qualification: "",
        profile_summary: "",
        father_name: "",
        mother_name: "",
        category: "",
        blood_group: "",
        tenth_board: "",
        tenth_year: "",
        tenth_marks: "",
        tenth_stream: "",
        twelfth_board: "",
        twelfth_year: "",
        twelfth_marks: "",
        twelfth_stream: "",
        graduation_university: "",
        graduation_year: "",
        graduation_marks: "",
        graduation_stream: "",
        graduation_field: "",
        pg_university: "",
        pg_year: "",
        pg_marks: "",
        pg_stream: "",
        pg_field: "",
        skill_type: "",
        skill_trade: "",
        skill_year: "",
        experience_type: "",
        passport: "",
        relocation: "",
    });

    React.useEffect(() => { fetchJob(); }, []);

    const fetchJob = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/job/search/${slug}`);
            if (res.data?.success) setJob(res.data.data);
        } catch (e) {
            console.error("FetchJob Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const applyJob = async () => {
        if (!isAuthenticated) {
            Alert.alert("Unauthorized", "Please login again to apply", [
                { text: "Login", onPress: () => navigation.navigate("Login") },
                { text: "Cancel", style: "cancel" }
            ]);
            return;
        }
        setApplying(true);
        try {
            const res = await API.post(`/job/apply/${job.id}`);
            if (res.data?.success) {
                setJob(prev => ({ ...prev, is_applied: true }));
                Alert.alert("Success", "Applied successfully!");
            }
        } catch (e) {
            console.error("ApplyJob Error:", e);
            if (e.response?.status === 422) {
                setProfileModal(true);
            } else if (e.response?.status === 401) {
                Alert.alert("Unauthorized", "Please login again to apply", [
                    { text: "Login", onPress: () => navigation.navigate("Login") },
                    { text: "Cancel", style: "cancel" }
                ]);
            } else {
                Alert.alert("Error", e.response?.data?.message || "Failed to apply");
            }
        } finally {
            setApplying(false);
        }
    };

    const updateProfile = async () => {
        setUpdating(true);
        try {
            const res = await API.post('/student/profile/update', form);
            if (res.data.success) {
                Alert.alert("Success", "Profile Updated");
                setProfileModal(false);
                applyJob();
            }
        } catch (err) {
            Alert.alert("Error", "Profile update failed");
        } finally {
            setUpdating(false);
        }
    };

    const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const currentSection = SECTIONS[activeSection];
    const isLastSection = activeSection === SECTIONS.length - 1;

    if (loading) return <Loader message='Loading Opportunities details...' />;
    if (!job) return null;

    const highlights = JSON.parse(job.highlights || '[]');
    const skills = job.skills?.split('\r\n\r\n').filter(Boolean) || [];
    const roleMatches = job.description?.match(/<p[^>]*>(Data Scientist|Data Analyst|Machine Learning Engineer|Business Intelligence Analyst|Software Engineer)<\/p>/g) || [];
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
                                : <Text style={styles.logoEmoji}>🎓</Text>
                            }
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

                    <View style={styles.divider} />

                    {skills.length > 0 && (
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
                    )}

                    <View style={styles.divider} />

                    {roles.length > 0 && (
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
                    )}

                    <View style={styles.divider} />

                    {job.eligibility && (
                        <View style={styles.section}>
                            <View style={styles.secHeader}>
                                <View style={styles.secBar} />
                                <Text style={styles.secTitle}>Eligibility</Text>
                            </View>
                            <Text style={styles.eligText}>{job.eligibility}</Text>
                        </View>
                    )}
                </ScrollView>

                {/* Sticky Bottom Bar */}
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
                            : <Text style={styles.applyText}>{applying ? 'Applying...' : 'Apply Now'}</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Full-Screen Profile Modal ── */}
            <Modal
                visible={profileModal}
                animationType="slide"
                presentationStyle="fullScreen"
                statusBarTranslucent>

                <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

                <View style={mStyles.screen}>

                    {/* Modal Header */}
                    <View style={mStyles.header}>
                        <View>
                            <Text style={mStyles.headerTitle}>Complete Your Profile</Text>
                            <Text style={mStyles.headerSub}>Fill in details to apply for this job</Text>
                        </View>
                        <TouchableOpacity onPress={() => setProfileModal(false)} style={mStyles.closeBtn}>
                            <Ionicons name="close" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Progress Bar */}
                    <View style={mStyles.progressWrap}>
                        <View style={mStyles.progressTrack}>
                            <View style={[mStyles.progressFill, { width: `${((activeSection + 1) / SECTIONS.length) * 100}%` }]} />
                        </View>
                        <Text style={mStyles.progressText}>{activeSection + 1} / {SECTIONS.length}</Text>
                    </View>

                    {/* Section Tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={mStyles.tabRow}
                        contentContainerStyle={mStyles.tabRowContent}>
                        {SECTIONS.map((s, i) => (
                            <SectionTab
                                key={s.key}
                                section={s}
                                active={i === activeSection}
                                onPress={() => setActiveSection(i)}
                            />
                        ))}
                    </ScrollView>

                    {/* Section Title */}
                    <View style={mStyles.sectionHeader}>
                        <View style={mStyles.sectionIconWrap}>
                            <Ionicons name={currentSection.icon} size={18} color={COLORS.primary} />
                        </View>
                        <Text style={mStyles.sectionTitle}>{currentSection.title}</Text>
                    </View>

                    {/* Fields */}
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <ScrollView
                            style={mStyles.fieldsScroll}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={mStyles.fieldsContent}
                            keyboardShouldPersistTaps="handled">

                            {currentSection.fields.map(field => (
                                <View key={field.key} style={mStyles.fieldWrap}>
                                    <Text style={mStyles.fieldLabel}>{field.label}</Text>
                                    <FieldInput
                                        field={field}
                                        value={form[field.key]}
                                        onChange={(val) => setField(field.key, val)}
                                    />
                                </View>
                            ))}

                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </KeyboardAvoidingView>

                    {/* Footer Navigation */}
                    <View style={mStyles.footer}>
                        {activeSection > 0 && (
                            <TouchableOpacity
                                style={mStyles.backBtn}
                                onPress={() => setActiveSection(prev => prev - 1)}>
                                <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                                <Text style={mStyles.backBtnText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[mStyles.nextBtn, activeSection === 0 && { flex: 1 }]}
                            onPress={() => {
                                if (isLastSection) {
                                    updateProfile();
                                } else {
                                    setActiveSection(prev => prev + 1);
                                }
                            }}
                            disabled={updating}
                            activeOpacity={0.85}>
                            {isLastSection
                                ? <>
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                                    <Text style={mStyles.nextBtnText}>{updating ? 'Saving...' : ' Update & Apply'}</Text>
                                  </>
                                : <>
                                    <Text style={mStyles.nextBtnText}>Next</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                  </>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Layout>
    );
}

// ─── Job Detail Styles ─────────────────────────────────────────────────────────
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

// ─── Modal Styles ──────────────────────────────────────────────────────────────
const mStyles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f7f8fa' },

    // Header
    header: {
        backgroundColor: COLORS.primary,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 54,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },

    // Progress
    progressWrap: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 10,
        backgroundColor: '#fff', gap: 10,
        borderBottomWidth: 1, borderBottomColor: '#eee',
    },
    progressTrack: {
        flex: 1, height: 5, backgroundColor: '#eee',
        borderRadius: 3, overflow: 'hidden',
    },
    progressFill: {
        height: '100%', backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    progressText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, minWidth: 32 },

    // Tabs
    tabRow: { backgroundColor: '#fff', maxHeight: 48 },
    tabRowContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row' },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, backgroundColor: '#f2f2f2',
    },
    tabActive: { backgroundColor: COLORS.primaryLight },
    tabText: { fontSize: 11, fontWeight: '600', color: '#999' },
    tabTextActive: { color: COLORS.primary },

    // Section Header
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    },
    sectionIconWrap: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center', justifyContent: 'center',
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },

    // Fields
    fieldsScroll: { flex: 1 },
    fieldsContent: { paddingHorizontal: 16, paddingTop: 4 },
    fieldWrap: { marginBottom: 14 },
    fieldLabel: {
        fontSize: 11, fontWeight: '700', color: '#555',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1.5, borderColor: '#e8e8e8',
        borderRadius: 12,
        paddingHorizontal: 14, height: 48,
        fontSize: 14, color: '#1a1a1a',
    },
    inputMulti: {
        height: 88, paddingTop: 12, textAlignVertical: 'top',
    },
    // pickerWrap / picker removed — using SafePicker (JS-only) instead

    // Footer
    footer: {
        flexDirection: 'row', gap: 10,
        paddingHorizontal: 16, paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: '#eee',
    },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 18, height: 50, borderRadius: 14,
        borderWidth: 1.5, borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    backBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    nextBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 6,
        height: 50, borderRadius: 14, backgroundColor: COLORS.primary,
    },
    nextBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});