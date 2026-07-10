import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    Platform,
    SafeAreaView,
} from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import API from '../../utils/axiosInstanct'; // Keep your API instance
import useAuthStore from '../../store/useAuthStore';

const BRAND = {
    primary: '#e12e4c',
    primaryDark: '#c41f3b',
    gradient: ['#d92828', '#e54646', '#f45555'],
    ink: '#1E2937',
    sub: '#64748B',
    border: '#E2E8F0',
    bg: '#F8FAFC',
    success: '#059669',
    successBg: '#D1FAE5',
    danger: '#DC2626',
    dangerBg: '#FEE2E2',
};

const steps = ['Basic Info', 'Personal', 'Education', 'Skills & Career'];

/* ------------------------------------------------------------------ */
/* Picker option sets — everything that has a finite set of sensible  */
/* answers becomes a picker so the user taps instead of types.        */
/* ------------------------------------------------------------------ */
const OPTIONS = {
    gender: ['Male', 'Female', 'Other'],
    age_group: ['Below 18', '18-21', '22-25', '26-30', '31-35', '36-40', '40+'],
    present_status: ['Student', 'Fresher', 'Employed', 'Unemployed', 'Self-Employed'],
    state: [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
        'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
        'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
        'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
        'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi (NCT)', 'Jammu & Kashmir',
        'Ladakh', 'Chandigarh', 'Puducherry', 'Other',
    ],
    father_mother_relation: [], // unused placeholder
    category: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'],
    blood_group: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', "Don't know"],
    highest_qualification: [
        'Below 10th', '10th Pass', '12th Pass', 'ITI', 'Diploma', 'Graduate',
        'Post Graduate', 'Other',
    ],
    stream: ['Science', 'Commerce', 'Arts', 'Vocational', 'Other'],
    skill_type: ['Technical', 'Non-Technical', 'IT / Software', 'Trade / Vocational', 'Other'],
    looking_for: ['Full-Time Job', 'Part-Time Job', 'Internship', 'Apprenticeship', 'Overseas Job'],
    experience_type: ['Fresher', 'Experienced'],
    yes_no: ['Yes', 'No'],
};

/* ------------------------------------------------------------------ */
/* Compact picker field — looks identical to a text input but opens   */
/* the native picker, so the form doesn't feel like two different UIs */
/* ------------------------------------------------------------------ */
function FieldPicker({ label, value, onChange, options, flex, placeholder = 'Select' }) {
    return (
        <View style={[styles.inputWrap, flex && { flex: 1 }]}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.pickerBox}>
                <Picker
                    selectedValue={value}
                    onValueChange={(v) => {
                        Haptics.selectionAsync().catch(() => {});
                        onChange(v);
                    }}
                    mode="dropdown"
                    dropdownIconColor="#94A3B8"
                    style={styles.pickerInline}
                >
                    <Picker.Item label={placeholder} value="" color="#9CA3AF" />
                    {options.map((opt) => (
                        <Picker.Item key={opt} label={opt} value={opt} />
                    ))}
                </Picker>
            </View>
        </View>
    );
}

/* ------------------------------------------------------------------ */
/* Profile-complete screen — shown the instant every step is done so  */
/* the user never has to click through steps again just to get a PDF */
/* ------------------------------------------------------------------ */
function ProfileCompleteScreen({ student, onGeneratePDF, onEdit, generatingPdf }) {
    const fields = [
        { label: 'Name', value: student?.name },
        { label: 'Email', value: student?.email },
        { label: 'Phone', value: student?.phone },
        { label: 'State', value: student?.state },
        { label: 'District', value: student?.district },
        { label: 'Qualification', value: student?.highest_qualification },
        { label: 'Skill', value: student?.skill_trade },
        { label: 'Experience', value: student?.skill_year ? `${student.skill_year} yrs` : null },
    ].filter((f) => f.value);

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient colors={BRAND.gradient} style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Resume Builder</Text>
                    <Text style={styles.headerSubtitle}>Your profile is complete 🎉</Text>
                </View>
            </LinearGradient>

            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                enableOnAndroid
            >
                <View style={styles.readyCard}>
                    <View style={styles.readyIconWrap}>
                        <Ionicons name="document-text" size={26} color={BRAND.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.readyTitle}>Your resume is ready</Text>
                        <Text style={styles.readySubtitle}>Preview or download it as a PDF anytime.</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={onGeneratePDF}
                    disabled={generatingPdf}
                    activeOpacity={0.85}
                >
                    <LinearGradient colors={[BRAND.primary, BRAND.primaryDark]} style={styles.nextGradient}>
                        {generatingPdf ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="eye-outline" size={18} color="#fff" />
                                <Text style={styles.nextButtonText}>Preview &amp; Download Resume</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.sectionTitleSmall}>Saved Details</Text>
                <View style={styles.detailsCard}>
                    {fields.map((f, i) => (
                        <View
                            key={i}
                            style={[
                                styles.detailRow,
                                i === fields.length - 1 && { borderBottomWidth: 0 },
                            ]}
                        >
                            <Text style={styles.detailLabel}>{f.label}</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>{f.value}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.editLink} onPress={onEdit} activeOpacity={0.7}>
                    <Ionicons name="create-outline" size={16} color={BRAND.sub} />
                    <Text style={styles.editLinkText}>Edit my details</Text>
                </TouchableOpacity>

                <View style={{ height: 24 }} />
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}

export default function ResumeBuilder({ navigation }) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const { student, fetchProfile } = useAuthStore();
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [photo, setPhoto] = useState(null);

    const [form, setForm] = useState({
        // Basic Information
        name: '',
        phone: '',
        email: '',
        whatsapp: '',
        age_group: '',
        gender: '',
        present_status: '',
        state: '',
        district: '',
        pincode: '',
        address: '',

        // Personal Details
        father_name: '',
        mother_name: '',
        category: '',
        blood_group: '',
        profile_summary: '',

        // Education
        highest_qualification: '',

        tenth_board: '',
        tenth_year: '',
        tenth_marks: '',
        tenth_stream: '',

        twelfth_board: '',
        twelfth_year: '',
        twelfth_marks: '',
        twelfth_stream: '',

        graduation_university: '',
        graduation_year: '',
        graduation_marks: '',
        graduation_stream: '',
        graduation_field: '',

        pg_university: '',
        pg_year: '',
        pg_marks: '',
        pg_stream: '',
        pg_field: '',

        // Skills & Career
        skill_type: '',
        skill_trade: '',
        skill_year: '',
        looking_for: '',
        experience_type: '',
        passport: '',
        relocation: '',
    });

    const stepCompletionStatus = useMemo(() => {
        if (!student) return [false, false, false, false];
        return [
            !!(student.name && student.phone && student.email && student.whatsapp && student.age_group && student.gender && student.present_status && student.state && student.district && student.pincode && student.address),
            !!(student.father_name && student.mother_name && student.category && student.blood_group && student.profile_summary),
            !!(student.highest_qualification && student.tenth_board && student.tenth_year && student.tenth_marks && student.twelfth_board && student.twelfth_year && student.twelfth_marks && student.graduation_university && student.graduation_year && student.graduation_marks && student.graduation_stream),
            !!(student.skill_type && student.skill_trade && student.skill_year && student.looking_for && student.experience_type && student.passport && student.relocation),
        ];
    }, [student]);

    const isProfileComplete = useMemo(() => stepCompletionStatus.every(Boolean), [stepCompletionStatus]);

    const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
        });

        if (!result.canceled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setPhoto(result.assets[0]);
        }
    };

    const validateCurrentStep = () => {
        if (step === 0) {
            if (!form.name || !form.phone || !form.email) {
                Alert.alert('Required', 'Please fill Name, Phone & Email');
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateCurrentStep() && step < steps.length - 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step > 0) {
            Haptics.selectionAsync().catch(() => {});
            setStep(step - 1);
        }
    };

    /* ---------------------------------------------------------------- */
    /* PDF generation — a cleaner, two-tone, single-page resume layout  */
    /* ---------------------------------------------------------------- */
    const generateResumePDF = async () => {
        setGeneratingPdf(true);

        try {
            // Try to embed the profile photo as a data URI so it shows up in the PDF
            let photoDataUri = '';
            if (photo?.uri) {
                try {
                    const base64 = await FileSystem.readAsStringAsync(photo.uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    const mime = photo.mimeType || 'image/jpeg';
                    photoDataUri = `data:${mime};base64,${base64}`;
                } catch (e) {
                    photoDataUri = '';
                }
            }

            const initials = (form.name || 'NA')
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase();

            const chip = (text) => (text ? `<span class="chip">${text}</span>` : '');
            const infoRow = (label, value) =>
                value ? `<div class="row"><span class="label">${label}</span><span class="value">${value}</span></div>` : '';

            const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Helvetica', Arial, sans-serif;
            font-size: 13.5px;
            line-height: 1.6;
            color: #1f2937;
            margin: 0;
            background: #fff;
          }
          .banner {
            background: linear-gradient(135deg, #d92828, #f45555);
            padding: 34px 45px 56px 45px;
            color: #fff;
          }
          .banner-inner { display: flex; align-items: center; gap: 20px; }
          .avatar {
            width: 84px; height: 84px; border-radius: 50%;
            border: 3px solid rgba(255,255,255,0.85);
            object-fit: cover; background: rgba(255,255,255,0.25);
          }
          .avatar-fallback {
            width: 84px; height: 84px; border-radius: 50%;
            border: 3px solid rgba(255,255,255,0.85);
            background: rgba(255,255,255,0.25);
            display: flex; align-items: center; justify-content: center;
            font-size: 30px; font-weight: 700; color: #fff;
          }
          .name { font-size: 26px; font-weight: 800; margin: 0 0 4px 0; }
          .tagline { font-size: 13px; opacity: 0.92; margin: 0 0 10px 0; font-weight: 600; letter-spacing: 0.3px; }
          .chips { display: flex; flex-wrap: wrap; gap: 8px; }
          .chip {
            background: rgba(255,255,255,0.18);
            border: 1px solid rgba(255,255,255,0.35);
            padding: 4px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600;
          }
          .content { padding: 0 45px 40px 45px; margin-top: -28px; }
          .card {
            background: #fff; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            border: 1px solid #EEF1F5; padding: 18px 20px; margin-bottom: 16px;
          }
          .section-title {
            font-size: 13px; font-weight: 800; color: #d92828;
            text-transform: uppercase; letter-spacing: 0.9px;
            margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
          }
          .section-title:before {
            content: ''; width: 4px; height: 13px; background: #d92828; border-radius: 2px; display: inline-block;
          }
          .two-col { display: flex; gap: 24px; }
          .two-col .card { flex: 1; }
          .edu-item { padding: 10px 0; border-bottom: 1px solid #F1F5F9; }
          .edu-item:last-child { border-bottom: none; padding-bottom: 0; }
          .edu-title { font-weight: 700; font-size: 13.5px; color: #1f2937; }
          .edu-sub { font-size: 12px; color: #64748B; margin-top: 2px; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #F1F5F9; }
          .row:last-child { border-bottom: none; }
          .label { font-weight: 600; color: #64748B; font-size: 12.5px; }
          .value { font-weight: 700; color: #1f2937; font-size: 12.5px; text-align: right; max-width: 60%; }
          .summary { font-size: 13px; color: #374151; }
          .footer { text-align: center; font-size: 10.5px; color: #9CA3AF; padding: 10px 0 0; }
        </style>
      </head>
      <body>
        <div class="banner">
          <div class="banner-inner">
            ${photoDataUri
                    ? `<img class="avatar" src="${photoDataUri}" />`
                    : `<div class="avatar-fallback">${initials}</div>`}
            <div>
              <p class="name">${form.name || 'Your Name'}</p>
              <p class="tagline">${form.skill_trade || form.highest_qualification || 'Job Seeker'}</p>
              <div class="chips">
                ${chip(form.phone)}
                ${chip(form.email)}
                ${chip(form.whatsapp ? `WhatsApp: ${form.whatsapp}` : '')}
                ${chip(form.district && form.state ? `${form.district}, ${form.state}` : '')}
              </div>
            </div>
          </div>
        </div>

        <div class="content">
          ${form.profile_summary ? `
          <div class="card">
            <div class="section-title">Profile Summary</div>
            <div class="summary">${form.profile_summary}</div>
          </div>` : ''}

          <div class="card">
            <div class="section-title">Education</div>
            ${form.highest_qualification ? `<div class="edu-sub" style="margin-bottom:8px;"><strong style="color:#1f2937;">Highest Qualification:</strong> ${form.highest_qualification}</div>` : ''}

            ${form.pg_university ? `
            <div class="edu-item">
              <div class="edu-title">${form.pg_field || 'Post Graduation'}</div>
              <div class="edu-sub">${form.pg_university} • ${form.pg_year || ''} • ${form.pg_marks ? form.pg_marks + '%' : ''} ${form.pg_stream ? '• ' + form.pg_stream : ''}</div>
            </div>` : ''}

            ${form.graduation_university ? `
            <div class="edu-item">
              <div class="edu-title">${form.graduation_field || 'Graduation'}</div>
              <div class="edu-sub">${form.graduation_university} • ${form.graduation_year || ''} • ${form.graduation_marks ? form.graduation_marks + '%' : ''} ${form.graduation_stream ? '• ' + form.graduation_stream : ''}</div>
            </div>` : ''}

            ${form.twelfth_board ? `
            <div class="edu-item">
              <div class="edu-title">12th ${form.twelfth_stream ? `(${form.twelfth_stream})` : ''}</div>
              <div class="edu-sub">${form.twelfth_board} • ${form.twelfth_year || ''} • ${form.twelfth_marks ? form.twelfth_marks + '%' : ''}</div>
            </div>` : ''}

            ${form.tenth_board ? `
            <div class="edu-item">
              <div class="edu-title">10th</div>
              <div class="edu-sub">${form.tenth_board} • ${form.tenth_year || ''} • ${form.tenth_marks ? form.tenth_marks + '%' : ''}</div>
            </div>` : ''}
          </div>

          <div class="two-col">
            <div class="card">
              <div class="section-title">Skills &amp; Career</div>
              ${infoRow('Skill Type', form.skill_type)}
              ${infoRow('Skill / Trade', form.skill_trade)}
              ${infoRow('Experience', form.skill_year ? `${form.skill_year} yrs` : '')}
              ${infoRow('Looking For', form.looking_for)}
              ${infoRow('Exp. Type', form.experience_type)}
              ${infoRow('Passport', form.passport)}
              ${infoRow('Relocate', form.relocation)}
            </div>

            <div class="card">
              <div class="section-title">Personal Details</div>
              ${infoRow("Father's Name", form.father_name)}
              ${infoRow("Mother's Name", form.mother_name)}
              ${infoRow('Gender', form.gender)}
              ${infoRow('Age Group', form.age_group)}
              ${infoRow('Blood Group', form.blood_group)}
              ${infoRow('Category', form.category)}
            </div>
          </div>

          <div class="card">
            <div class="section-title">Address</div>
            <div class="summary">${[form.address, form.district, form.state, form.pincode].filter(Boolean).join(', ')}</div>
          </div>

          <div class="footer">Generated with Resume Builder</div>
        </div>
      </body>
      </html>`;

            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                width: 612,
                height: 792,
            });

            const fileName = `Resume_${(form.name || 'Candidate').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            const destinationUri = `${FileSystem.cacheDirectory}${fileName}`;

            await FileSystem.copyAsync({ from: uri, to: destinationUri });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(destinationUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `${form.name || 'Candidate'}'s Resume`,
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert('PDF Generated', 'File saved successfully');
            }
        } catch (error) {
            console.error('PDF Generation Error:', error);
            Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        } finally {
            setGeneratingPdf(false);
        }
    };

    const submitProfile = async () => {
        try {
            setLoading(true);
            const formData = new FormData();

            Object.keys(form).forEach((key) => {
                if (form[key]) formData.append(key, form[key]);
            });

            if (photo) {
                formData.append('photo', {
                    uri: photo.uri,
                    name: 'profile.jpg',
                    type: 'image/jpeg',
                });
            }

            const res = await API.post('/auth/update-student-profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data?.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                Alert.alert('Success', 'Your resume has been saved successfully!', [
                    { text: 'Great!', onPress: () => setEditMode(false) },
                ]);
            } else {
                Alert.alert('Error', res.data?.message || 'Something went wrong');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to save resume. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (student) {
            setForm((prev) => ({ ...prev, ...student }));
        }
    }, [student]);

    useEffect(() => {
        fetchProfile();
    }, []);

    /* ---------------------------------------------------------------- */
    /* Field renderers                                                   */
    /* ---------------------------------------------------------------- */
    const renderInput = (label, fieldKey, placeholder = '', options = {}) => (
        <View style={[styles.inputWrap, options.flex && { flex: 1 }]}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, options.multiline && styles.multilineInput]}
                placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                placeholderTextColor="#9CA3AF"
                value={form[fieldKey]}
                onChangeText={(v) => updateField(fieldKey, v)}
                keyboardType={options.keyboardType || 'default'}
                multiline={options.multiline}
                numberOfLines={options.multiline ? 3 : 1}
            />
        </View>
    );

    const renderPicker = (label, fieldKey, optionKey, extra = {}) => (
        <FieldPicker
            label={label}
            value={form[fieldKey]}
            onChange={(v) => updateField(fieldKey, v)}
            options={OPTIONS[optionKey]}
            flex={extra.flex}
            placeholder={extra.placeholder}
        />
    );

    const renderStepWarning = (stepIndex) => {
        if (editMode && !stepCompletionStatus[stepIndex]) {
            return (
                <View style={styles.warningBanner}>
                    <Ionicons name="alert-circle" size={18} color={BRAND.danger} />
                    <Text style={styles.warningText}>This step is incomplete. Please fill all required fields.</Text>
                </View>
            );
        }
        return null;
    };

    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (
                    <>
                        {renderStepWarning(0)}
                        <UploadPhoto photo={photo} onPress={pickImage} />

                        {renderInput('Full Name *', 'name')}
                        <View style={styles.row}>
                            {renderInput('Phone *', 'phone', '', { keyboardType: 'phone-pad', flex: true })}
                            {renderInput('WhatsApp', 'whatsapp', '', { keyboardType: 'phone-pad', flex: true })}
                        </View>
                        {renderInput('Email Address *', 'email', '', { keyboardType: 'email-address' })}

                        <View style={styles.row}>
                            {renderPicker('Age Group', 'age_group', 'age_group', { flex: true })}
                            {renderPicker('Gender', 'gender', 'gender', { flex: true })}
                        </View>
                        {renderPicker('Present Status', 'present_status', 'present_status')}

                        <View style={styles.row}>
                            {renderPicker('State', 'state', 'state', { flex: true })}
                            {renderInput('District', 'district', '', { flex: true })}
                        </View>
                        {renderInput('Pincode', 'pincode', '', { keyboardType: 'numeric' })}
                        {renderInput('Full Address', 'address', '', { multiline: true })}
                    </>
                );

            case 1:
                return (
                    <>
                        {renderStepWarning(1)}
                        <View style={styles.row}>
                            {renderInput("Father's Name", 'father_name', '', { flex: true })}
                            {renderInput("Mother's Name", 'mother_name', '', { flex: true })}
                        </View>
                        <View style={styles.row}>
                            {renderPicker('Category', 'category', 'category', { flex: true })}
                            {renderPicker('Blood Group', 'blood_group', 'blood_group', { flex: true })}
                        </View>
                        {renderInput('Profile Summary', 'profile_summary', 'Write a short professional summary...', { multiline: true })}
                    </>
                );

            case 2:
                return (
                    <>
                        {renderStepWarning(2)}
                        {renderPicker('Highest Qualification', 'highest_qualification', 'highest_qualification')}

                        <Text style={styles.sectionTitle}>10th Details</Text>
                        <View style={styles.row}>
                            {renderInput('Board', 'tenth_board', '', { flex: true })}
                            {renderPicker('Stream', 'tenth_stream', 'stream', { flex: true })}
                        </View>
                        <View style={styles.row}>
                            {renderInput('Year', 'tenth_year', '', { keyboardType: 'numeric', flex: true })}
                            {renderInput('Marks (%)', 'tenth_marks', '', { keyboardType: 'numeric', flex: true })}
                        </View>

                        <Text style={styles.sectionTitle}>12th Details</Text>
                        <View style={styles.row}>
                            {renderInput('Board', 'twelfth_board', '', { flex: true })}
                            {renderPicker('Stream', 'twelfth_stream', 'stream', { flex: true })}
                        </View>
                        <View style={styles.row}>
                            {renderInput('Year', 'twelfth_year', '', { keyboardType: 'numeric', flex: true })}
                            {renderInput('Marks (%)', 'twelfth_marks', '', { keyboardType: 'numeric', flex: true })}
                        </View>

                        <Text style={styles.sectionTitle}>Graduation</Text>
                        {renderInput('University / College', 'graduation_university')}
                        <View style={styles.row}>
                            {renderInput('Year', 'graduation_year', '', { keyboardType: 'numeric', flex: true })}
                            {renderInput('Marks (%) / CGPA', 'graduation_marks', '', { flex: true })}
                        </View>
                        <View style={styles.row}>
                            {renderPicker('Stream', 'graduation_stream', 'stream', { flex: true })}
                            {renderInput('Field / Specialization', 'graduation_field', '', { flex: true })}
                        </View>

                        <Text style={styles.sectionTitle}>Post Graduation (if any)</Text>
                        {renderInput('University / College', 'pg_university')}
                        <View style={styles.row}>
                            {renderInput('Year', 'pg_year', '', { keyboardType: 'numeric', flex: true })}
                            {renderInput('Marks (%) / CGPA', 'pg_marks', '', { flex: true })}
                        </View>
                        <View style={styles.row}>
                            {renderPicker('Stream', 'pg_stream', 'stream', { flex: true })}
                            {renderInput('Field / Specialization', 'pg_field', '', { flex: true })}
                        </View>
                    </>
                );

            case 3:
                return (
                    <>
                        {renderStepWarning(3)}
                        <View style={styles.row}>
                            {renderPicker('Skill Type', 'skill_type', 'skill_type', { flex: true })}
                            {renderInput('Skill / Trade', 'skill_trade', '', { flex: true })}
                        </View>
                        {renderInput('Years of Experience', 'skill_year', '', { keyboardType: 'numeric' })}
                        {renderPicker('Looking For', 'looking_for', 'looking_for')}
                        {renderPicker('Experience Type', 'experience_type', 'experience_type')}
                        <View style={styles.row}>
                            {renderPicker('Passport', 'passport', 'yes_no', { flex: true })}
                            {renderPicker('Willing to Relocate?', 'relocation', 'yes_no', { flex: true })}
                        </View>
                    </>
                );

            default:
                return null;
        }
    };

    if (isProfileComplete && !editMode) {
        return (
            <ProfileCompleteScreen
                student={student}
                onGeneratePDF={generateResumePDF}
                onEdit={() => setEditMode(true)}
                generatingPdf={generatingPdf}
            />
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient colors={BRAND.gradient} style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.headerTopRow}>
                        <Text style={styles.headerTitle}>Resume Builder</Text>
                        {isProfileComplete && (
                            <TouchableOpacity onPress={() => setEditMode(false)} style={styles.closeEditBtn}>
                                <Ionicons name="close" size={18} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.headerSubtitle}>Create a professional profile in minutes</Text>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.stepText}>{steps[step]} • Step {step + 1} of {steps.length}</Text>
                    </View>
                </View>
            </LinearGradient>

            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                enableOnAndroid
                extraScrollHeight={20}
                keyboardShouldPersistTaps="handled"
            >
                {renderStepContent()}
                <View style={styles.footerSpacer} />
            </KeyboardAwareScrollView>

            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={[styles.navButton, step === 0 && styles.disabledBtn]}
                    onPress={prevStep}
                    disabled={step === 0}
                >
                    <Ionicons name="chevron-back" size={18} color={step === 0 ? '#9CA3AF' : BRAND.primary} />
                    <Text style={[styles.navButtonText, step === 0 && styles.disabledText]}>Back</Text>
                </TouchableOpacity>

                {step < steps.length - 1 ? (
                    <TouchableOpacity style={styles.nextButton} onPress={nextStep} activeOpacity={0.85}>
                        <LinearGradient colors={[BRAND.primary, BRAND.primaryDark]} style={styles.nextGradient}>
                            <Text style={styles.nextButtonText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.nextButton} onPress={submitProfile} disabled={loading} activeOpacity={0.85}>
                        <LinearGradient colors={['#10B981', '#059669']} style={styles.nextGradient}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                                    <Text style={styles.nextButtonText}>Save Profile</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

function UploadPhoto({ photo, onPress }) {
    return (
        <TouchableOpacity style={styles.photoContainer} onPress={onPress} activeOpacity={0.8}>
            {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
            ) : (
                <View style={styles.photoPlaceholder}>
                    <LinearGradient colors={['#ffe0e0', '#fdb5b5']} style={styles.placeholderGradient}>
                        <Ionicons name="camera" size={30} color="#e54646" />
                        <Text style={styles.uploadText}>Add Photo</Text>
                    </LinearGradient>
                </View>
            )}
            <View style={styles.photoEditBadge}>
                <Ionicons name="pencil" size={12} color="#fff" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: BRAND.bg },
    header: {
        paddingTop: Platform.OS === 'ios' ? 12 : 24,
        paddingBottom: 22,
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
    },
    headerContent: { paddingHorizontal: 22 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 2 },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 16 },
    closeEditBtn: {
        width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    progressContainer: { marginTop: 4 },
    progressBg: { height: 7, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 999 },
    stepText: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 8, opacity: 0.9 },

    scrollContent: { padding: 20, paddingBottom: 40 },

    sectionTitle: { fontSize: 15, fontWeight: '700', color: BRAND.ink, marginTop: 18, marginBottom: 8 },
    sectionTitleSmall: { fontSize: 14, fontWeight: '700', color: BRAND.ink, marginBottom: 10, marginTop: 4 },

    row: { flexDirection: 'row', gap: 10 },

    inputWrap: { marginBottom: 14 },
    label: { fontSize: 12.5, fontWeight: '700', color: BRAND.ink, marginBottom: 6 },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 14,
        color: '#111827',
        borderWidth: 1.2,
        borderColor: BRAND.border,
    },
    multilineInput: { height: 90, textAlignVertical: 'top' },

    pickerBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1.2,
        borderColor: BRAND.border,
        justifyContent: 'center',
        height: Platform.OS === 'ios' ? undefined : 46,
        overflow: 'hidden',
    },
    pickerInline: {
        color: '#111827',
        marginVertical: Platform.OS === 'ios' ? 0 : -6,
    },

    warningBanner: {
        backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 16,
        flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1.2, borderColor: '#FECACA',
    },
    warningText: { color: BRAND.danger, fontWeight: '600', fontSize: 12.5, flex: 1 },

    footerSpacer: { height: 70 },

    bottomNav: {
        flexDirection: 'row',
        padding: 14,
        paddingBottom: Platform.OS === 'ios' ? 22 : 48,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 10,
    },
    navButton: {
        flex: 0.7,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 4,
    },
    navButtonText: { fontWeight: '700', color: BRAND.primary, fontSize: 12.5 },
    disabledBtn: { backgroundColor: '#F8FAFC' },
    disabledText: { color: '#94A3B8' },

    nextButton: { flex: 1.4 },
    nextGradient: {
        height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        flexDirection: 'row', gap: 8,
    },
    nextButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    photoContainer: { alignSelf: 'center', marginBottom: 22, position: 'relative' },
    photoImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
    photoPlaceholder: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', borderWidth: 3, borderColor: '#fff' },
    placeholderGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
    uploadText: { color: '#e54646', fontWeight: '700', fontSize: 11.5 },
    photoEditBadge: {
        position: 'absolute', bottom: 0, right: 0,
        width: 26, height: 26, borderRadius: 13, backgroundColor: BRAND.primary,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
    },

    /* Profile-complete screen */
    readyCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
        borderWidth: 1.2, borderColor: BRAND.border,
    },
    readyIconWrap: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE7EA',
        alignItems: 'center', justifyContent: 'center',
    },
    readyTitle: { fontSize: 15, fontWeight: '700', color: BRAND.ink },
    readySubtitle: { fontSize: 12.5, color: BRAND.sub, marginTop: 2 },

    primaryActionBtn: { marginBottom: 24 },

    detailsCard: {
        backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16,
        borderWidth: 1.2, borderColor: BRAND.border,
    },
    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    detailLabel: { color: BRAND.sub, fontSize: 13, fontWeight: '600' },
    detailValue: { color: '#111827', fontSize: 13, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },

    editLink: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
    editLinkText: { color: BRAND.sub, fontSize: 13, fontWeight: '600' },
});