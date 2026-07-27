const locationData = require("../utils/state");



// Get all states
exports.getStates = async (req, res) => {
    try {
        const states = locationData.states.map(item => item.state);

        return res.status(200).json({
            success: true,
            count: states.length,
            data: states,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch states",
            error: error.message,
        });
    }
};
// GET /api/location/districts/:state?search=ja
exports.getDistricts = async (req, res) => {
    try {
        const { state } = req.params;
        const { search } = req.query;

        const stateData = locationData.states.find(
            (item) => item.state.toLowerCase() === state.toLowerCase()
        );

        if (!stateData) {
            return res.status(404).json({
                success: false,
                message: "State not found",
            });
        }

        let districts = stateData.districts;

        // Search district
        if (search && search.trim() !== "") {
            const keyword = search.trim().toLowerCase();

            districts = districts.filter((district) =>
                district.toLowerCase().includes(keyword)
            );
        }

        return res.status(200).json({
            success: true,
            state: stateData.state,
            count: districts.length,
            data: districts,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch districts",
            error: error.message,
        });
    }
};