import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    RefreshControl,
    Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Layout from "../../components/layout";
import API from "../../utils/axiosInstanct";

export default function MyBundleCourses() {
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bundles, setBundles] = useState([]);

    const [selectedBundle, setSelectedBundle] = useState(null);
    const [showCourses, setShowCourses] = useState(false);

    const loadBundles = async () => {
        try {
            const res = await API.get("/bundle/my-bundle-purchases");

            if (res.data.success) {
                setBundles(res.data.data || []);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBundles();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadBundles();
    }, []);

    const handleBundlePress = (bundle) => {
        if (!bundle.courses || bundle.courses.length === 0) {
            return;
        }

        if (bundle.courses.length === 1) {
            navigation.navigate("Classroom", {
                courseId: bundle.courses[0].id,
            });
            return;
        }

        setSelectedBundle(bundle);
        setShowCourses(true);
    };

    const renderBundle = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            style={styles.card}
            onPress={() => handleBundlePress(item)}
        >
            <Image
                source={{ uri: item.thumbnail }}
                style={styles.image}
            />

            <View style={styles.info}>
                <Text numberOfLines={2} style={styles.title}>
                    {item.title}
                </Text>

                <Text style={styles.courseCount}>
                    {item.courses?.length || 0} Courses
                </Text>

                <View style={styles.row}>
                    <Ionicons
                        name="checkmark-circle"
                        color="#16a34a"
                        size={16}
                    />

                    <Text style={styles.status}>
                        Purchased
                    </Text>
                </View>

                <Text style={styles.date}>
                    Purchased on{" "}
                    {new Date(item.purchased_at).toLocaleDateString()}
                </Text>
            </View>

            <Ionicons
                name="chevron-forward"
                size={22}
                color="#999"
            />
        </TouchableOpacity>
    );

    const renderCourse = ({ item }) => (
        <TouchableOpacity
            style={styles.courseCard}
            onPress={() => {
                setShowCourses(false);

                navigation.navigate("Classroom", {
                    courseId: item.id,
                });
            }}
        >
            <Image
                source={{ uri: item.thumbnail }}
                style={styles.courseImage}
            />

            <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={styles.courseTitle}>
                    {item.title}
                </Text>
            </View>

            <Ionicons
                name="play-circle"
                color="#2563eb"
                size={24}
            />
        </TouchableOpacity>
    );

    return (
        <Layout headerType="backTitle"
           onBack={() => navigation.goBack()}
            subtitle={"Home > Bundle Courses > Enrolled Bundles"}
            title="My Bundle Courses">
            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator
                        size="large"
                        color="#2563eb"
                    />
                </View>
            ) : (
                <FlatList
                    data={bundles}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderBundle}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons
                                name="library-outline"
                                size={70}
                                color="#cbd5e1"
                            />
                            <Text style={styles.emptyTitle}>
                                No Bundle Purchased
                            </Text>
                            <Text style={styles.emptyText}>
                                Your purchased bundles will appear here.
                            </Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={showCourses}
                animationType="slide"
                transparent
            >
                <View style={styles.modalBg}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedBundle?.title}
                            </Text>

                            <TouchableOpacity
                                onPress={() => setShowCourses(false)}
                            >
                                <Ionicons
                                    name="close"
                                    size={28}
                                />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={selectedBundle?.courses || []}
                            keyExtractor={(item) =>
                                item.id.toString()
                            }
                            renderItem={renderCourse}
                        />
                    </View>
                </View>
            </Modal>
        </Layout>
    );
}

const styles = StyleSheet.create({
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        marginHorizontal: 15,
        marginTop: 12,
        borderRadius: 12,
        padding: 10,
        elevation: 2,
        alignItems: "center",
    },

    image: {
        width: 90,
        height: 90,
        borderRadius: 10,
    },

    info: {
        flex: 1,
        marginLeft: 12,
    },

    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },

    courseCount: {
        marginTop: 6,
        color: "#2563eb",
        fontWeight: "600",
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },

    status: {
        marginLeft: 6,
        color: "#16a34a",
        fontWeight: "600",
    },

    date: {
        marginTop: 8,
        fontSize: 13,
        color: "#6b7280",
    },

    empty: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginTop: 20,
    },

    emptyText: {
        marginTop: 10,
        textAlign: "center",
        color: "#6b7280",
    },

    modalBg: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "flex-end",
    },

    modal: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        padding: 20,
        paddingBottom: 65,
        maxHeight: "75%",
    },

    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        flex: 1,
        marginRight: 10,
    },

    courseCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: "#eee",
    },

    courseImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },

    courseTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },
});