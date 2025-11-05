#!/usr/bin/env python3
"""
Script to process markdown files before syncing to deploy branch.

This script:
1. Removes YAML frontmatter description sections from MD files
2. Converts level 2 titles to level 1 titles in SUMMARY.md
3. Removes <figure></figure> HTML elements but keeps content inside
4. Converts all GitBook {% %} tags to standard markdown format
"""

import os
import re
import sys
from pathlib import Path


def remove_yaml_frontmatter(content):
    """Remove YAML frontmatter from markdown content."""
    # Match YAML frontmatter at the beginning of the file
    pattern = r'^---\n.*?\n---\n'
    return re.sub(pattern, '', content, flags=re.DOTALL | re.MULTILINE)


def process_summary_titles(content):
    """Convert level 2 titles (##) to level 1 titles (#) in SUMMARY.md."""
    # Replace ## with #
    return re.sub(r'^## ', '# ', content, flags=re.MULTILINE)


def remove_figure_tags(content):
    """Remove <figure></figure> HTML elements but keep the content inside."""
    # Remove opening <figure> tags (with any attributes)
    content = re.sub(r'<figure[^>]*>', '', content)
    
    # Remove closing </figure> tags
    content = re.sub(r'</figure>', '', content)
    
    # Clean up any extra whitespace that might be left
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    
    return content


def convert_gitbook_tags(content):
    """Convert all GitBook {% %} tags to standard markdown format."""
    
    # Pattern to match {% embed url="..." %} tags
    embed_pattern = r'{%\s*embed\s+url="([^"]+)"\s*%}'
    
    # Pattern to match any other {% ... %} tags (like code blocks, hints, etc.)
    general_tag_pattern = r'{%\s*([^%]+)\s*%}'
    
    def convert_embed(match):
        url = match.group(1)
        
        # Check if it's a YouTube URL and convert to proper markdown
        if 'youtube.com' in url or 'youtu.be' in url:
            # Extract video ID for YouTube URLs
            video_id = None
            if 'youtube.com/watch?v=' in url:
                video_id = url.split('v=')[1].split('&')[0]
            elif 'youtube.com/embed/' in url:
                video_id = url.split('/embed/')[1].split('?')[0]
            elif 'youtu.be/' in url:
                video_id = url.split('youtu.be/')[1].split('?')[0]
            
            if video_id:
                # Return markdown format with thumbnail and link
                return f"[![YouTube Video](https://img.youtube.com/vi/{video_id}/maxresdefault.jpg)]({url})\n\n[Watch on YouTube]({url})"
            else:
                return f"[YouTube Video]({url})"
        else:
            # For non-YouTube URLs, just create a regular link
            return f"[View Content]({url})"
    
    def convert_general_tag(match):
        tag_content = match.group(1).strip()
        
        # Handle specific GitBook tags
        if tag_content.startswith('hint'):
            return "> **Note:** "
        elif tag_content.startswith('code'):
            return ""  # Remove code block tags, keep the actual code
        elif tag_content.startswith('endcode'):
            return ""  # Remove end code block tags
        elif 'url=' in tag_content and 'embed' not in tag_content:
            # Handle other URL-containing tags
            url_match = re.search(r'url="([^"]+)"', tag_content)
            if url_match:
                return f"[Link]({url_match.group(1)})"
        
        # For unrecognized tags, just remove them
        return ""
    
    # First handle embed tags specifically
    content = re.sub(embed_pattern, convert_embed, content)
    
    # Then handle remaining {% %} tags
    content = re.sub(general_tag_pattern, convert_general_tag, content)
    
    return content


def process_markdown_file(file_path):
    """Process a single markdown file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all transformations
        content = remove_yaml_frontmatter(content)
        content = remove_figure_tags(content)
        content = convert_gitbook_tags(content)
        
        # Special processing for SUMMARY.md
        if file_path.name == 'SUMMARY.md':
            content = process_summary_titles(content)
        
        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Processed: {file_path}")
            return True
        else:
            print(f"No changes: {file_path}")
            return False
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False


def find_markdown_files(src_dir):
    """Find all markdown files in the src directory."""
    src_path = Path(src_dir)
    if not src_path.exists():
        print(f"Source directory {src_dir} does not exist")
        return []
    
    markdown_files = list(src_path.rglob('*.md'))
    return markdown_files


def main():
    """Main function to process all markdown files."""
    # Get the repository root directory
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent.parent
    
    print(f"Repository root: {repo_root}")
    
    # In main branch, files are in root directory, not src
    # In deploy branch, files are in src directory
    # Check which structure we're dealing with
    src_dir = repo_root / 'src'
    if src_dir.exists():
        print(f"Found src directory: {src_dir}")
        markdown_files = find_markdown_files(src_dir)
    else:
        print(f"Using root directory: {repo_root}")
        markdown_files = find_markdown_files(repo_root)
    
    # Find all markdown files
    if not markdown_files:
        print("No markdown files found to process")
        return 0
    
    print(f"Found {len(markdown_files)} markdown files to process")
    
    # Process each file
    processed_count = 0
    for file_path in markdown_files:
        if process_markdown_file(file_path):
            processed_count += 1
    
    print(f"Successfully processed {processed_count} files")
    return 0


if __name__ == '__main__':
    sys.exit(main())