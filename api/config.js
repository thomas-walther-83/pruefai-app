export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    schoolName: process.env.SCHOOL_NAME || '',
  });
}
