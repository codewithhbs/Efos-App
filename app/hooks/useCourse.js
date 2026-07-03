import { useCallback, useEffect, useState } from "react";
import API from "../utils/axiosInstanct";

export const useCourse = ({ id = null, userId = null }) => {
    const [courses, setCourses] = useState([]);
    const [courseDetails, setCourseDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    // Get All Home Courses
    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);

            const response = await API.get("/extra/home-learning-course");
            setCourses(response.data.data || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Get Course Details by ID
    const fetchCourseViaId = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);

            const response = await API.get(`/extra/home-learning-course-details/${id}?userId=${userId}`);
            setCourseDetails(response.data.data || null);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchCourseViaId();
        } else {
            fetchCourses();
        }
    }, [id, fetchCourses, fetchCourseViaId]);

    return {
        courses,
        courseDetails,
        loading,
        refetch: id ? fetchCourseViaId : fetchCourses,
    };
};