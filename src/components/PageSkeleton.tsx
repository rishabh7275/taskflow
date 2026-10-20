import { Box, Container, Skeleton } from "@mui/material";

export default function PageSkeleton() {
  return (
    <Container maxWidth="xl" sx={{ pt: 3, pb: 6 }}>
      {/* Stats bar skeleton */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1.4fr 1fr 1fr 1fr" },
          mb: 4,
        }}
      >
        <Skeleton variant="rounded" height={88} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={88} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={88} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={88} sx={{ borderRadius: 3 }} />
      </Box>

      {/* Filter / title bar skeleton */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Skeleton variant="text" width={140} height={40} />
        <Skeleton variant="rounded" width={220} height={36} sx={{ borderRadius: 2 }} />
      </Box>

      {/* Columns skeleton */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
        }}
      >
        <Skeleton variant="rounded" height={380} sx={{ borderRadius: 4 }} />
        <Skeleton variant="rounded" height={380} sx={{ borderRadius: 4 }} />
        <Skeleton variant="rounded" height={380} sx={{ borderRadius: 4 }} />
      </Box>
    </Container>
  );
}
