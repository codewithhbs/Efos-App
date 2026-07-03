import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import API from "../../utils/axiosInstanct";
import { COLORS } from "../../utils/dummyData";

const AllQuizOfChapter = ({ route, navigation }) => {
    const { courseId, chapterId } = route.params || {};

    const [loading, setLoading] = useState(false);
    const [quizzes, setQuizzes] = useState([]);

    // Fetch quizzes
    const fetchQuizes = async () => {
        try {
            setLoading(true);

            const res = await API.get(
                `/extra/all-quiz/${courseId}`
            );

            setQuizzes(res?.data?.quizzes || []);

        } catch (error) {
            console.log(
                "Quiz Error:",
                error?.response?.data || error.message
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            fetchQuizes();
        }
    }, [courseId, chapterId]);

    const renderQuiz = ({ item, index }) => (
        <TouchableOpacity
            style={styles.quizCard}
            activeOpacity={0.8}
            onPress={() =>
                navigation.navigate("QuizDetails", {
                    quizId: item.id,
                })
            }
        >
            <View style={styles.left}>
                <View style={styles.iconWrap}>
                    <Ionicons
                        name="help-circle-outline"
                        size={20}
                        color={COLORS.accent}
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.quizTitle}>
                        {item.title || `Quiz ${index + 1}`}
                    </Text>

                    <Text style={styles.quizDesc}>
                        {item.description || "Test your knowledge"}
                    </Text>
                </View>
            </View>

            <Ionicons
                name="chevron-forward"
                size={18}
                color="#9CA3AF"
            />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.heading}>
                Chapter Quizzes
            </Text>

            {loading ? (
                <ActivityIndicator
                    size="large"
                    color={COLORS.accent}
                    style={{ marginTop: 30 }}
                />
            ) : quizzes.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>
                        No quizzes available
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={quizzes}
                    keyExtractor={(item) =>
                        item.id.toString()
                    }
                    renderItem={renderQuiz}
                    contentContainerStyle={{
                        paddingBottom: 20,
                    }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

export default AllQuizOfChapter;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        paddingHorizontal: 16,
        paddingTop: 10,
    },

    heading: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 18,
    },

    quizCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    left: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },

    iconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: "#EEF2FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    quizTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },

    quizDesc: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 3,
    },

    emptyWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    emptyText: {
        fontSize: 14,
        color: "#6B7280",
    },
});