import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Dimensions,
    Image,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import API from '../../utils/axiosInstanct'; // Keep your API instance
import useAuthStore from '../../store/useAuthStore';

const { width } = Dimensions.get('window');

const steps = [
    'Basic Information',
    'Personal Details',
    'Education Details',
    'Skills & Career',
];
function AlreadyFilledScreen({ student, onGeneratePDF, onEdit, generatingPdf, stepCompletionStatus, isProfileComplete }) {
    const fields = [
        { label: 'Name', value: student?.name },
        { label: 'Email', value: student?.email },
        { label: 'Phone', value: student?.phone },
        { label: 'State', value: student?.state },
        { label: 'District', value: student?.district },
        { label: 'Qualification', value: student?.highest_qualification },
        { label: 'Skill', value: student?.skill_trade },
        { label: 'Experience', value: student?.skill_year ? `${student.skill_year} yrs` : null },
    ].filter(f => f.value);

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient colors={['#d92828', '#e54646', '#f45555']} style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Resume Builder</Text>
                    <Text style={styles.headerSubtitle}>Your profile overview</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Step completion status */}
                <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 12 }]}>Section Status</Text>
                {steps.map((stepName, i) => (
                    <View key={i} style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
                        borderWidth: 1.5, borderColor: stepCompletionStatus[i] ? '#D1FAE5' : '#FEE2E2',
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{
                                width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                                backgroundColor: stepCompletionStatus[i] ? '#D1FAE5' : '#FEE2E2',
                            }}>
                                <Ionicons
                                    name={stepCompletionStatus[i] ? 'checkmark' : 'alert'}
                                    size={16}
                                    color={stepCompletionStatus[i] ? '#059669' : '#DC2626'}
                                />
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E2937' }}>{stepName}</Text>
                        </View>
                        {stepCompletionStatus[i]
                            ? <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>Complete</Text>
                            : <TouchableOpacity onPress={onEdit}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Incomplete — Fill Now</Text>
                            </TouchableOpacity>
                        }
                    </View>
                ))}

                {/* Saved details */}
                <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#E2E8F0', marginTop: 8, marginBottom: 20 }}>
                    <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Saved Details</Text>
                    {fields.map((f, i) => (
                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: i < fields.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9' }}>
                            <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '600' }}>{f.label}</Text>
                            <Text style={{ color: '#111827', fontSize: 14, fontWeight: '700', maxWidth: '60%', textAlign: 'right' }}>{f.value}</Text>
                        </View>
                    ))}
                </View>

            </ScrollView>

            <View style={styles.bottomNav}>
                <TouchableOpacity style={[styles.navButton, { flex: 1 }]} onPress={onEdit}>
                    <Ionicons name="create-outline" size={18} color="#4F46E5" />
                    <Text style={styles.navButtonText}>Update Details</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.nextButton, !isProfileComplete && { opacity: 0.5 }]} onPress={onGeneratePDF} disabled={generatingPdf || !stepCompletionStatus.every(Boolean)}>
                    <LinearGradient colors={['#e12e4c', '#e12e4c']} style={styles.nextGradient}>
                        {generatingPdf
                            ? <ActivityIndicator color="#fff" />
                            : <>
                                <Ionicons name="download-outline" size={18} color="#fff" />
                                <Text style={styles.nextButtonText}>Download Resume</Text>
                            </>
                        }
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
export default function ResumeBuilder({ navigation }) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const { student, fetchProfile } = useAuthStore()
    const [generatingPdf, setGeneratingPdf] = useState(false);
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
            // Step 0: Basic Information
            !!(student.name && student.phone && student.email && student.whatsapp && student.age_group && student.gender && student.present_status && student.state && student.district && student.pincode && student.address),
            // Step 1: Personal Details
            !!(student.father_name && student.mother_name && student.category && student.blood_group && student.profile_summary),
            // Step 2: Education
            !!(student.highest_qualification && student.tenth_board && student.tenth_year && student.tenth_marks && student.twelfth_board && student.twelfth_year && student.twelfth_marks && student.graduation_university && student.graduation_year && student.graduation_marks && student.graduation_stream),
            // Step 3: Skills & Career
            !!(student.skill_type && student.skill_trade && student.skill_year && student.looking_for && student.experience_type && student.passport && student.relocation),
        ];
    }, [student]);
    const [editMode, setEditMode] = useState(false);

    const isProfileComplete = useMemo(() => stepCompletionStatus.every(Boolean), [stepCompletionStatus]);
    const [photo, setPhoto] = useState(null);

    const progress = useMemo(() => {
        return ((step + 1) / steps.length) * 100;
    }, [step]);

    const updateField = (key, value) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
        });

        if (!result.canceled) {
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
        // Add more validation as needed
        return true;
    };

    const nextStep = () => {
        if (validateCurrentStep() && step < steps.length - 1) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const generateResumePDF = async () => {
        setGeneratingPdf(true);

        try {
            const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Helvetica', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.7;
            color: #1f2937;
            margin: 0;
            padding: 40px 45px;
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 35px;
            padding-bottom: 20px;
            border-bottom: 3px solid #4F46E5;
          }
          .name {
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 8px 0;
            color: #1f2937;
          }
          .contact-info {
            font-size: 13.8px;
            color: #374151;
            margin: 0;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #4F46E5;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 8px;
            margin-bottom: 14px;
          }
          .content {
            font-size: 14px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .label {
            font-weight: 600;
            color: #374151;
            min-width: 145px;
          }
          strong {
            color: #1f2937;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="name">${form.name || 'Your Name'}</h1>
          <p class="contact-info">
            ${form.email} &nbsp; | &nbsp; ${form.phone}
            ${form.whatsapp ? ` &nbsp; | &nbsp; WhatsApp: ${form.whatsapp}` : ''}
            <br>
            ${form.address ? `${form.address}, ${form.district}, ${form.state} - ${form.pincode}` : ''}
          </p>
        </div>

        <!-- Profile Summary -->
        ${form.profile_summary ? `
        <div class="section">
          <div class="section-title">Profile Summary</div>
          <div class="content">${form.profile_summary}</div>
        </div>` : ''}

        <!-- Education -->
        <div class="section">
          <div class="section-title">Education</div>
          <div class="content">
            <strong>${form.highest_qualification || ''}</strong><br><br>

            ${form.graduation_university ? `
              <strong>${form.graduation_field || 'Graduation'}</strong> — ${form.graduation_university}<br>
              Year: ${form.graduation_year} &nbsp; | &nbsp; Marks: ${form.graduation_marks}% &nbsp; | &nbsp; ${form.graduation_stream}<br><br>` : ''}

            ${form.pg_university ? `
              <strong>${form.pg_field || 'Post Graduation'}</strong> — ${form.pg_university}<br>
              Year: ${form.pg_year} &nbsp; | &nbsp; Marks: ${form.pg_marks}% &nbsp; | &nbsp; ${form.pg_stream}<br><br>` : ''}

            ${form.twelfth_board ? `
              <strong>12th (${form.twelfth_stream || ''})</strong> — ${form.twelfth_board}<br>
              Year: ${form.twelfth_year} &nbsp; | &nbsp; Marks: ${form.twelfth_marks}%<br><br>` : ''}

            ${form.tenth_board ? `
              <strong>10th</strong> — ${form.tenth_board}<br>
              Year: ${form.tenth_year} &nbsp; | &nbsp; Marks: ${form.tenth_marks}%<br>` : ''}
          </div>
        </div>

        <!-- Skills & Career -->
        <div class="section">
          <div class="section-title">Skills & Career</div>
          <div class="content">
            <div class="row"><span class="label">Skill / Trade:</span> <span>${form.skill_trade}</span></div>
            <div class="row"><span class="label">Experience:</span> <span>${form.skill_year} Years</span></div>
            <div class="row"><span class="label">Looking For:</span> <span>${form.looking_for}</span></div>
            <div class="row"><span class="label">Experience Type:</span> <span>${form.experience_type}</span></div>
            <div class="row"><span class="label">Passport:</span> <span>${form.passport}</span></div>
            <div class="row"><span class="label">Willing to Relocate:</span> <span>${form.relocation}</span></div>
          </div>
        </div>

        <!-- Personal Details -->
        <div class="section">
          <div class="section-title">Personal Details</div>
          <div class="content">
            <div class="row"><span class="label">Father's Name:</span> <span>${form.father_name}</span></div>
            <div class="row"><span class="label">Mother's Name:</span> <span>${form.mother_name}</span></div>
            <div class="row"><span class="label">Gender:</span> <span>${form.gender}</span></div>
            <div class="row"><span class="label">Age Group:</span> <span>${form.age_group}</span></div>
            <div class="row"><span class="label">Blood Group:</span> <span>${form.blood_group}</span></div>
            <div class="row"><span class="label">Category:</span> <span>${form.category}</span></div>
          </div>
        </div>
      </body>
      </html>`;

            // Generate PDF
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                width: 612,   // A4 Width
                height: 792,  // A4 Height
            });

            // Save to permanent location
            const fileName = `Resume_${(form.name || 'Candidate').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            const destinationUri = `${FileSystem.cacheDirectory}${fileName}`;

            await FileSystem.copyAsync({
                from: uri,
                to: destinationUri,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(destinationUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `${form.name}'s Resume`,
                    UTI: 'com.adobe.pdf',           // iOS
                });

                Alert.alert('✅ Success', 'Resume generated successfully!\nYou can now save or share it.');
            } else {
                Alert.alert('PDF Generated', 'File saved successfully');
            }

            Alert.alert('✅ Success', 'Resume opened successfully in PDF viewer');

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
                if (form[key]) {
                    formData.append(key, form[key]);
                }
            });

            if (photo) {
                formData.append('photo', {
                    uri: photo.uri,
                    name: 'profile.jpg',
                    type: 'image/jpeg',
                });
            }

            const res = await API.post(
                '/auth/update-student-profile',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (res.data?.success) {
                Alert.alert('Success', 'Your resume has been saved successfully!', [
                    { text: 'Great!', onPress: () => { navigation.goBack() } },
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
            setForm((prev) => ({
                ...prev,
                ...student,
            }));
        }
    }, [student]);
    useEffect(() => {
        fetchProfile()
    }, [])

    const renderInput = (label, fieldKey, placeholder = '', options = {}) => (
        <View style={styles.inputWrap}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    options.multiline && styles.multilineInput,
                ]}
                placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                placeholderTextColor="#9CA3AF"
                value={form[fieldKey]}
                onChangeText={(v) => updateField(fieldKey, v)}
                keyboardType={options.keyboardType || 'default'}
                multiline={options.multiline}
                numberOfLines={options.multiline ? 4 : 1}
                {...options}
            />
        </View>
    );
    // Add this helper above renderStepContent:
    const renderStepWarning = (stepIndex) => {
        if (editMode && !stepCompletionStatus[stepIndex]) {
            return (
                <View style={{ backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14, marginBottom: 20, flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#FECACA' }}>
                    <Ionicons name="alert-circle" size={20} color="#DC2626" />
                    <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 13, flex: 1 }}>
                        This step is incomplete. Please fill all required fields.
                    </Text>
                </View>
            );
        }
        return null;
    };
    const renderStepContent = () => {
        switch (step) {
            case 0: // Basic Information
                return (
                    <>
                        <UploadPhoto photo={photo} onPress={pickImage} />

                        {renderInput('Full Name *', 'name')}
                        {renderInput('Phone Number *', 'phone', '', { keyboardType: 'phone-pad' })}
                        {renderInput('Email Address *', 'email', '', { keyboardType: 'email-address' })}
                        {renderInput('WhatsApp Number', 'whatsapp', '', { keyboardType: 'phone-pad' })}
                        {renderInput('Age Group', 'age_group')}
                        {renderInput('Gender', 'gender')}
                        {renderInput('Present Status', 'present_status')}
                        {renderInput('State', 'state')}
                        {renderInput('District', 'district')}
                        {renderInput('Pincode', 'pincode', '', { keyboardType: 'numeric' })}
                        {renderInput('Full Address', 'address', '', { multiline: true })}
                    </>
                );

            case 1: // Personal Details
                return (
                    <>
                        {renderInput("Father's Name", 'father_name')}
                        {renderInput("Mother's Name", 'mother_name')}
                        {renderInput('Category', 'category')}
                        {renderInput('Blood Group', 'blood_group')}
                        {renderInput('Profile Summary', 'profile_summary', 'Write a short professional summary...', {
                            multiline: true,
                        })}
                    </>
                );

            case 2: // Education Details
                return (
                    <>
                        {renderInput('Highest Qualification', 'highest_qualification')}

                        <Text style={styles.sectionTitle}>10th Details</Text>
                        {renderInput('Board', 'tenth_board')}
                        {renderInput('Year of Passing', 'tenth_year', '', { keyboardType: 'numeric' })}
                        {renderInput('Marks (%)', 'tenth_marks', '', { keyboardType: 'numeric' })}
                        {renderInput('Stream', 'tenth_stream')}

                        <Text style={styles.sectionTitle}>12th Details</Text>
                        {renderInput('Board', 'twelfth_board')}
                        {renderInput('Year of Passing', 'twelfth_year', '', { keyboardType: 'numeric' })}
                        {renderInput('Marks (%)', 'twelfth_marks', '', { keyboardType: 'numeric' })}
                        {renderInput('Stream', 'twelfth_stream')}

                        <Text style={styles.sectionTitle}>Graduation</Text>
                        {renderInput('University / College', 'graduation_university')}
                        {renderInput('Year', 'graduation_year', '', { keyboardType: 'numeric' })}
                        {renderInput('Marks (%) / CGPA', 'graduation_marks')}
                        {renderInput('Stream', 'graduation_stream')}
                        {renderInput('Field / Specialization', 'graduation_field')}

                        <Text style={styles.sectionTitle}>Post Graduation (if any)</Text>
                        {renderInput('University / College', 'pg_university')}
                        {renderInput('Year', 'pg_year', '', { keyboardType: 'numeric' })}
                        {renderInput('Marks (%) / CGPA', 'pg_marks')}
                        {renderInput('Stream', 'pg_stream')}
                        {renderInput('Field / Specialization', 'pg_field')}
                    </>
                );

            case 3: // Skills & Career
                return (
                    <>
                        {renderInput('Skill Type', 'skill_type')}
                        {renderInput('Skill / Trade', 'skill_trade')}
                        {renderInput('Years of Experience', 'skill_year', '', { keyboardType: 'numeric' })}
                        {renderInput('Looking For', 'looking_for')}
                        {renderInput('Experience Type', 'experience_type')}
                        {renderInput('Passport Status', 'passport')}
                        {renderInput('Willing to Relocate?', 'relocation')}
                    </>
                );

            default:
                return null;
        }
    };


    if (isProfileComplete && !editMode) {
        return (
            <AlreadyFilledScreen
                student={student}
                onGeneratePDF={generateResumePDF}
                onEdit={() => setEditMode(true)}
                generatingPdf={generatingPdf}
                isProfileComplete={isProfileComplete}
                stepCompletionStatus={stepCompletionStatus}
            />
        );
    }
    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <LinearGradient
                    colors={['#d92828', '#e54646', '#f45555']}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Resume Builder</Text>
                        <Text style={styles.headerSubtitle}>
                            Create a professional profile in minutes
                        </Text>

                        <View style={styles.progressContainer}>
                            <View style={styles.progressBg}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${progress}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.stepText}>
                                {steps[step]} • Step {step + 1} of {steps.length}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderStepContent()}

                    <View style={styles.footerSpacer} />
                </ScrollView>

                {/* Sticky Bottom Navigation */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity
                        style={[styles.navButton, step === 0 && styles.disabledBtn]}
                        onPress={prevStep}
                        disabled={step === 0}
                    >
                        <Ionicons name="chevron-back" size={20} color={step === 0 ? '#9CA3AF' : '#4F46E5'} />
                        <Text style={[styles.navButtonText, step === 0 && styles.disabledText]}>Previous</Text>
                    </TouchableOpacity>

                    {step < steps.length - 1 ? (
                        <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                            <LinearGradient colors={['#e12e4c', '#e12e4c']} style={styles.nextGradient}>
                                <Text style={styles.nextButtonText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                            <TouchableOpacity style={styles.nextButton} onPress={generateResumePDF} disabled={generatingPdf}>
                                <LinearGradient colors={['#e12e4c', '#e12e4c']} style={styles.nextGradient}>
                                    {generatingPdf ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.nextButtonText}>Preview PDF</Text>

                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.nextButton} onPress={submitProfile} disabled={loading}>
                                <LinearGradient colors={['#10B981', '#059669']} style={styles.nextGradient}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextButtonText}>Save Profile</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function UploadPhoto({ photo, onPress }) {
    return (
        <TouchableOpacity style={styles.photoContainer} onPress={onPress}>
            {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
            ) : (
                <View style={styles.photoPlaceholder}>
                    <LinearGradient
                        colors={['#ffe0e0', '#fdb5b5']}
                        style={styles.placeholderGradient}
                    >
                        <Ionicons name="camera" size={42} color="#e54646" />
                        <Text style={styles.uploadText}>Upload </Text>

                    </LinearGradient>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        paddingHorizontal: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 24,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressBg: {
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 999,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 999,
    },
    stepText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 10,
        opacity: 0.9,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E2937',
        marginTop: 28,
        marginBottom: 12,
    },
    inputWrap: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E2937',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 16,
        fontSize: 15.5,
        color: '#111827',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    multilineInput: {
        height: 120,
        textAlignVertical: 'top',
    },
    footerSpacer: {
        height: 80,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        flexDirection: 'row',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 28 : 46,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 12,
    },
    navButton: {
        flex: 1 / 2,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    navButtonText: {
        fontWeight: '700',
        color: '#4F46E5',
        fontSize: 12,
    },
    disabledBtn: {
        backgroundColor: '#F8FAFC',
    },
    disabledText: {
        color: '#94A3B8',
    },
    nextButton: {
        flex: 1.4,
    },
    nextGradient: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    nextButtonText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 12,
    },
    photoContainer: {
        alignSelf: 'center',
        marginBottom: 32,
    },
    photoImage: {
        width: 138,
        height: 138,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: '#fff',
    },
    photoPlaceholder: {
        width: 138,
        height: 138,
        borderRadius: 70,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#fff',
    },
    placeholderGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadText: {
        color: '#e54646',
        fontWeight: '700',
        fontSize: 14,
        marginTop: 6,
    },
    uploadSubtext: {
        color: '#64748B',
        fontSize: 11.5,
    },
});