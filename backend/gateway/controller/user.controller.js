export const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json(req.user)
  } catch (error) {
    console.log("Error in getCurrentUser API");
    return res.status(500).json({ success: false, message: error.message });
  }
};
