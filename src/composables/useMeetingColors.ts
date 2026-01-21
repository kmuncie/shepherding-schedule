export function useMeetingColors() {
   const yearTextColors: Record<number, string> = {
      2023: '#1e40af',
      2024: '#166534',
      2025: '#7e22ce',
      2026: '#0f766e'
   };

   const quarterTextColors: Record<number, string> = {
      1: '#db2777',
      2: '#64748b',
      3: '#06b6d4',
      4: '#4d7c0f'
   };

   const getChipStyle = (completed: boolean) => {
      return {
         backgroundColor: completed ? '#dcfce7' : '#f5f5f5',
         border: completed ? 'none' : '1px solid #fcd34d',
         fontWeight: '600'
      };
   };

   const getYearColor = (year: number) => {
      return yearTextColors[year] || '#333';
   };

   const getQuarterColor = (quarter: number) => {
      return quarterTextColors[quarter] || '#333';
   };

   return {
      yearTextColors,
      quarterTextColors,
      getChipStyle,
      getYearColor,
      getQuarterColor
   };
}
