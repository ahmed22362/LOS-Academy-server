function majorityElement(nums: number[]): number {
  const map = {};
  let max = 0;
  if (nums.length == 1) {
    return nums[0];
  } else if (nums.length === 2) {
    return Math.max(nums[0], nums[1]);
  }
  for (let i = 0; i <= nums.length; i++) {
    let ele = nums[i];
    if (map[ele]) {
      map[ele] += 1;
    } else {
      map[ele] = 1;
    }
  }

  for (const [key, value] of Object.entries(map)) {
    if (value > max) {
      max = key;
    }
  }
  return max;
}
